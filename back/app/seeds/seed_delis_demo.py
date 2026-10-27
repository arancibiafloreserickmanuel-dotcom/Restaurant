"""
Deli's client-preview demo data: a chicken-restaurant menu, a floor of tables, and a
spread of orders — so a no-login preview deploy shows a working system instead of an
empty one. Every row this creates is named with a "(DEMO)" suffix so it is obvious to
anyone looking at the data, and so `remove_delis_demo.py` can find and delete it later.

Idempotent: safe to run on every deploy (checks names before inserting; never touches
rows without "(DEMO)" in the name). Scoped to tenant 1 only — the tenant the first
`/register` is assigned to on a virgin deployment (see main.py `register()`).

Usage:
  python -m app.seeds.seed_delis_demo
  (Render: wired as delis-back's preDeployCommand in render.yaml)

Remove later with: python -m app.seeds.remove_delis_demo
"""

import random
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from app.db import engine
from app.models import Floor, Order, OrderItem, OrderItemStatus, OrderStatus, Product, Table, Tenant

DEMO_TENANT_ID = 1
DEMO_SUFFIX = " (DEMO)"

# name, price in BOB cents, category (Main Course / Beverages match the Kitchen Display
# Station filter in kitchen-display.component.ts's VIEW_CATEGORY)
DEMO_PRODUCTS: list[tuple[str, int, str]] = [
    ("Pollo al spiedo entero" + DEMO_SUFFIX, 8500, "Main Course"),
    ("Medio pollo al spiedo" + DEMO_SUFFIX, 4500, "Main Course"),
    ("Cuarto de pollo broaster" + DEMO_SUFFIX, 2800, "Main Course"),
    ("8 presas de broaster" + DEMO_SUFFIX, 7500, "Main Course"),
    ("Porcion de papas fritas" + DEMO_SUFFIX, 1500, "Main Course"),
    ("Ensalada mixta" + DEMO_SUFFIX, 1200, "Main Course"),
    ("Gaseosa 2 litros" + DEMO_SUFFIX, 1200, "Beverages"),
    ("Gaseosa personal" + DEMO_SUFFIX, 700, "Beverages"),
]

DEMO_TABLE_NAMES = [f"Mesa {i}" + DEMO_SUFFIX for i in range(1, 5)]
DEMO_FLOOR_NAME = "Salon principal" + DEMO_SUFFIX
DEMO_CUSTOMER_NAMES = ["Katherine M.", "Juan Perez", "Rosa Quispe", "Luis Mamani", "Carla Flores"]


def _ensure_tenant(session: Session) -> int:
    existing = session.exec(select(Tenant)).all()
    if existing:
        return existing[0].id  # type: ignore[return-value]
    tenant = Tenant(name="Deli's")
    session.add(tenant)
    session.commit()
    session.refresh(tenant)
    print(f"Created tenant id={tenant.id} (Deli's).")
    return tenant.id  # type: ignore[return-value]


def _ensure_products(session: Session, tenant_id: int) -> list[Product]:
    existing_names = {
        p.name for p in session.exec(select(Product).where(Product.tenant_id == tenant_id)).all()
    }
    created = []
    for name, price_cents, category in DEMO_PRODUCTS:
        if name in existing_names:
            continue
        p = Product(tenant_id=tenant_id, name=name, price_cents=price_cents, category=category)
        session.add(p)
        created.append(p)
    if created:
        session.commit()
        for p in created:
            session.refresh(p)
        print(f"Created {len(created)} demo products.")
    return session.exec(
        select(Product).where(Product.tenant_id == tenant_id, Product.name.in_([n for n, *_ in DEMO_PRODUCTS]))
    ).all()


def _ensure_tables(session: Session, tenant_id: int) -> list[Table]:
    existing = session.exec(select(Table).where(Table.tenant_id == tenant_id)).all()
    existing_names = {t.name for t in existing}
    if set(DEMO_TABLE_NAMES) <= existing_names:
        return [t for t in existing if t.name in DEMO_TABLE_NAMES]

    floor = session.exec(
        select(Floor).where(Floor.tenant_id == tenant_id, Floor.name == DEMO_FLOOR_NAME)
    ).first()
    if floor is None:
        floor = Floor(tenant_id=tenant_id, name=DEMO_FLOOR_NAME)
        session.add(floor)
        session.commit()
        session.refresh(floor)

    positions = [(40, 40), (220, 40), (40, 160), (220, 160)]
    created = []
    for i, name in enumerate(DEMO_TABLE_NAMES):
        if name in existing_names:
            continue
        x, y = positions[i % len(positions)]
        t = Table(tenant_id=tenant_id, name=name, floor_id=floor.id, x_position=x, y_position=y)
        session.add(t)
        created.append(t)
    if created:
        session.commit()
        for t in created:
            session.refresh(t)
        print(f"Created {len(created)} demo tables on floor '{DEMO_FLOOR_NAME}'.")
    return session.exec(
        select(Table).where(Table.tenant_id == tenant_id, Table.name.in_(DEMO_TABLE_NAMES))
    ).all()


def _make_order(
    session: Session,
    tenant_id: int,
    table_id: int | None,
    products: list[Product],
    status: OrderStatus,
    created_at: datetime,
    paid: bool,
) -> None:
    order = Order(
        tenant_id=tenant_id,
        table_id=table_id,
        status=status,
        customer_name=random.choice(DEMO_CUSTOMER_NAMES),
        created_at=created_at,
        paid_at=created_at + timedelta(minutes=random.randint(15, 45)) if paid else None,
        payment_method=random.choice(["cash", "qr"]) if paid else None,
    )
    session.add(order)
    session.commit()
    session.refresh(order)

    item_status = (
        OrderItemStatus.delivered
        if paid
        else (OrderItemStatus.pending if status == OrderStatus.pending else OrderItemStatus.preparing)
    )
    for product in random.sample(products, k=random.randint(1, 3)):
        qty = random.randint(1, 2)
        session.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=qty,
                price_cents=product.price_cents,
                status=item_status,
            )
        )
    session.commit()


def _ensure_orders(session: Session, tenant_id: int, tables: list[Table], products: list[Product]) -> None:
    existing = session.exec(
        select(Order).where(Order.tenant_id == tenant_id, Order.customer_name.in_(DEMO_CUSTOMER_NAMES))
    ).first()
    if existing is not None:
        print("Demo orders already exist. Skipping.")
        return
    if not tables or not products:
        print("No demo tables/products to attach orders to. Skipping orders.")
        return

    now = datetime.now(timezone.utc)
    # A couple of orders visibly active right now, for Kitchen Display / Tables.
    _make_order(session, tenant_id, tables[0].id, products, OrderStatus.pending, now - timedelta(minutes=3), paid=False)
    _make_order(session, tenant_id, tables[1].id, products, OrderStatus.preparing, now - timedelta(minutes=8), paid=False)

    # A spread of paid orders over the last 14 days so Reports shows real numbers.
    for day_offset in range(14):
        if random.random() < 0.5:
            continue
        created_at = now - timedelta(days=day_offset, hours=random.randint(1, 10))
        table = random.choice(tables)
        _make_order(session, tenant_id, table.id, products, OrderStatus.paid, created_at, paid=True)

    print("Created demo orders (2 active + a spread of paid orders for Reports).")


def run() -> None:
    with Session(engine) as session:
        tenant_id = _ensure_tenant(session)
        if tenant_id != DEMO_TENANT_ID:
            print(f"Tenant 1 is not the active tenant (found id={tenant_id}); skipping Deli's demo seed.")
            return
        products = _ensure_products(session, tenant_id)
        tables = _ensure_tables(session, tenant_id)
        _ensure_orders(session, tenant_id, tables, products)
    print("Done.")


if __name__ == "__main__":
    run()
