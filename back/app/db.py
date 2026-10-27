from collections.abc import Generator

from sqlalchemy import Enum as SAEnum
from sqlmodel import Session, SQLModel, create_engine, select

from .settings import settings


engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)


def create_db_and_tables() -> None:
    """Create all tables.

    On a virgin Postgres database, SQLModel's native enum columns have
    `create_type=False` (see models.py) so each ENUM type must already exist,
    but `create_all` does not create them on its own and the column's CREATE
    TABLE fails with `UndefinedObject: type "..." does not exist`. Create the
    missing ENUM types first, then let `create_all` build (and skip) tables
    as usual; `checkfirst=True` makes this a no-op on an already-migrated DB.
    """
    seen: set[str] = set()
    for table in SQLModel.metadata.tables.values():
        for column in table.columns:
            col_type = column.type
            if (
                isinstance(col_type, SAEnum)
                and col_type.native_enum
                and col_type.name
                and col_type.name not in seen
            ):
                seen.add(col_type.name)
                col_type.create(engine, checkfirst=True)
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def check_db_connection() -> None:
    """
    Raises if the DB is not reachable or credentials/DB name are wrong.
    """
    with Session(engine) as session:
        session.exec(select(1)).first()

