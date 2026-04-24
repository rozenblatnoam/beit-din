"""add lawyers table and lawyer_id foreign keys

Revision ID: a1b2c3d4e5f6
Revises: e35098cde052
Create Date: 2026-04-24 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'e35098cde052'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'lawyers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('short_name', sa.String(), nullable=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('license_number', sa.String(), nullable=True),
        sa.Column('hashed_password', sa.String(), nullable=True),
        sa.Column('google_id', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_by_admin_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_lawyers_email'), 'lawyers', ['email'], unique=True)
    op.create_index(op.f('ix_lawyers_google_id'), 'lawyers', ['google_id'], unique=True)
    op.create_index(op.f('ix_lawyers_id'), 'lawyers', ['id'], unique=False)

    op.add_column('cases', sa.Column('lawyer_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_cases_lawyer_id', 'cases', 'lawyers', ['lawyer_id'], ['id'])

    op.add_column('documents', sa.Column('uploaded_by_lawyer_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_documents_uploaded_by_lawyer_id', 'documents', 'lawyers', ['uploaded_by_lawyer_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_documents_uploaded_by_lawyer_id', 'documents', type_='foreignkey')
    op.drop_column('documents', 'uploaded_by_lawyer_id')
    op.drop_constraint('fk_cases_lawyer_id', 'cases', type_='foreignkey')
    op.drop_column('cases', 'lawyer_id')
    op.drop_index(op.f('ix_lawyers_id'), table_name='lawyers')
    op.drop_index(op.f('ix_lawyers_google_id'), table_name='lawyers')
    op.drop_index(op.f('ix_lawyers_email'), table_name='lawyers')
    op.drop_table('lawyers')
