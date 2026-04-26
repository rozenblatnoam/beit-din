"""add drive_file_id and drive_edit_url to case_protocols

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-04-26 16:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('case_protocols', sa.Column('drive_file_id', sa.String(), nullable=True))
    op.add_column('case_protocols', sa.Column('drive_edit_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('case_protocols', 'drive_edit_url')
    op.drop_column('case_protocols', 'drive_file_id')
