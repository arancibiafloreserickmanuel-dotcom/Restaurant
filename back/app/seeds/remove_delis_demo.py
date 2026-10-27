"""
Remove everything seed_delis_demo.py created: only rows whose name contains
"(DEMO)" (products, tables, the demo floor) plus orders attached to a demo table
or whose only items are demo products. Never touches a product, table or order
without "(DEMO)" in its name — safe to run even if the owner has since added
real products or taken real orders on the demo tables.

Usage:
  python -m app.seeds.remove_delis_demo
  (Render: run once from the Shell tab on delis-back when you're done with the
  preview, then remove the preDeployCommand from render.yaml so it never reseeds.)
"""

from sqlmodel import Session, select

from app.db import engine
from app.models import Floor, Order, OrderItem, Product, Table

DEMO_MARK = "(DEMO)"


def run() -> None:
    with Session(engine) as session:
        demo_products = session.exec(select(Product).where(Product.name.like(f"%{DEMO_MARK}%"))).all()
        demo_product_ids = {p.id for p in demo_products}

        demo_tables = session.exec(select(Table).where(Table.name.like(f"%{DEMO_MARK}%"))).all()
        demo_table_ids = {t.id for t in demo_tables}

        orders_to_delete = set()
        if demo_table_ids:
            for o in session.exec(select(Order).where(Order.table_id.in_(demo_table_ids))).all():
                orders_to_delete.add(o.id)
        if demo_product_ids:
            for item in session.exec(select(OrderItem).where(OrderItem.product_id.in_(demo_product_ids))).all():
                orders_to_delete.add(item.order_id)

        items_deleted = 0
        for order_id in orders_to_delete:
            items = session.exec(select(OrderItem).where(OrderItem.order_id == order_id)).all()
            for item in items:
                session.delete(item)
                items_deleted += 1
        orders_deleted = 0
        for order_id in orders_to_delete:
            order = session.get(Order, order_id)
            if order is not None:
                session.delete(order)
                orders_deleted += 1
        session.commit()
        print(f"Deleted {orders_deleted} demo orders ({items_deleted} items).")

        for t in demo_tables:
            session.delete(t)
        session.commit()
        print(f"Deleted {len(demo_tables)} demo tables.")

        demo_floors = session.exec(select(Floor).where(Floor.name.like(f"%{DEMO_MARK}%"))).all()
        for f in demo_floors:
            session.delete(f)
        session.commit()
        print(f"Deleted {len(demo_floors)} demo floor(s).")

        for p in demo_products:
            session.delete(p)
        session.commit()
        print(f"Deleted {len(demo_products)} demo products.")

    print("Done. The Deli's demo data has been removed.")


if __name__ == "__main__":
    run()
