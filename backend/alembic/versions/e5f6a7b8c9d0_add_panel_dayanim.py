"""add dayan2_id and dayan3_id to cases for 3-judge panel

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-08 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('cases', sa.Column('dayan2_id', sa.Integer(), sa.ForeignKey('dayans.id'), nullable=True))
    op.add_column('cases', sa.Column('dayan3_id', sa.Integer(), sa.ForeignKey('dayans.id'), nullable=True))


def downgrade() -> None:
    op.drop_column('cases', 'dayan3_id')
    op.drop_column('cases', 'dayan2_id')
