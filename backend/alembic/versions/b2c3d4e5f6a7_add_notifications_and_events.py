"""add notifications and case_events tables

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-26 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('recipient_user_id', sa.Integer(), nullable=True),
        sa.Column('recipient_dayan_id', sa.Integer(), nullable=True),
        sa.Column('recipient_lawyer_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('body', sa.String(), nullable=True),
        sa.Column('link', sa.String(), nullable=True),
        sa.Column('related_case_id', sa.Integer(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['recipient_user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['recipient_dayan_id'], ['dayans.id']),
        sa.ForeignKeyConstraint(['recipient_lawyer_id'], ['lawyers.id']),
        sa.ForeignKeyConstraint(['related_case_id'], ['cases.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_notifications_recipient_user_id', 'notifications', ['recipient_user_id'])
    op.create_index('ix_notifications_recipient_dayan_id', 'notifications', ['recipient_dayan_id'])
    op.create_index('ix_notifications_recipient_lawyer_id', 'notifications', ['recipient_lawyer_id'])
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'])

    # Case events (timeline)
    op.create_table(
        'case_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('case_id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('actor_type', sa.String(), nullable=True),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_case_events_case_id', 'case_events', ['case_id'])


def downgrade() -> None:
    op.drop_index('ix_case_events_case_id', 'case_events')
    op.drop_table('case_events')
    op.drop_index('ix_notifications_is_read', 'notifications')
    op.drop_index('ix_notifications_recipient_lawyer_id', 'notifications')
    op.drop_index('ix_notifications_recipient_dayan_id', 'notifications')
    op.drop_index('ix_notifications_recipient_user_id', 'notifications')
    op.drop_table('notifications')
