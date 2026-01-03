#!/usr/bin/env python3
"""
Script to create an admin user in the database.
Run this after initial deployment to create the first admin.

Usage:
    python scripts/create_admin.py --username admin --password "secure_password" --display-name "מנהל ראשי"
    
Or with docker-compose:
    docker-compose exec data_server python scripts/create_admin.py --username admin --password "secure_password"
"""

import asyncio
import argparse
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import AsyncSessionLocal, engine
from app.models import Admin
from app.models.admin import Admin
from app.repository.admins import AdminsRepository
from app.schemas.admin import AdminCreate


async def create_admin(username: str, password: str, display_name: str = None, email: str = None):
    """Create a new admin user"""
    async with AsyncSessionLocal() as session:
        repo = AdminsRepository(session)
        
        # Check if admin already exists
        existing = await repo.get_by_username(username)
        if existing:
            print(f"Error: Admin with username '{username}' already exists.")
            return False
        
        # Create admin
        admin_data = AdminCreate(
            username=username,
            password=password,
            display_name=display_name,
            email=email,
        )
        
        admin = await repo.create(admin_data)
        print(f"✓ Admin created successfully!")
        print(f"  ID: {admin.id}")
        print(f"  Username: {admin.username}")
        print(f"  Display Name: {admin.display_name or 'N/A'}")
        print(f"  Email: {admin.email or 'N/A'}")
        return True


async def list_admins():
    """List all admins"""
    from sqlalchemy import select
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Admin))
        admins = result.scalars().all()
        
        if not admins:
            print("No admins found.")
            return
        
        print(f"\nFound {len(admins)} admin(s):\n")
        print("-" * 60)
        for admin in admins:
            status = "✓ Active" if admin.is_active else "✗ Inactive"
            print(f"ID: {admin.id} | Username: {admin.username} | {status}")
            if admin.display_name:
                print(f"         Display Name: {admin.display_name}")
            if admin.last_login:
                print(f"         Last Login: {admin.last_login}")
        print("-" * 60)


async def delete_admin(username: str):
    """Delete an admin by username"""
    async with AsyncSessionLocal() as session:
        repo = AdminsRepository(session)
        
        admin = await repo.get_by_username(username)
        if not admin:
            print(f"Error: Admin with username '{username}' not found.")
            return False
        
        await repo.delete(admin.id)
        print(f"✓ Admin '{username}' deleted successfully.")
        return True


def main():
    parser = argparse.ArgumentParser(description="Manage admin users")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new admin")
    create_parser.add_argument("--username", "-u", required=True, help="Admin username")
    create_parser.add_argument("--password", "-p", required=True, help="Admin password")
    create_parser.add_argument("--display-name", "-n", help="Display name")
    create_parser.add_argument("--email", "-e", help="Email address")
    
    # List command
    subparsers.add_parser("list", help="List all admins")
    
    # Delete command
    delete_parser = subparsers.add_parser("delete", help="Delete an admin")
    delete_parser.add_argument("--username", "-u", required=True, help="Username to delete")
    
    # For backwards compatibility, support direct args without subcommand
    parser.add_argument("--username", "-u", help="Admin username (for create)")
    parser.add_argument("--password", "-p", help="Admin password (for create)")
    parser.add_argument("--display-name", "-n", help="Display name (for create)")
    parser.add_argument("--email", "-e", help="Email address (for create)")
    
    args = parser.parse_args()
    
    # If no subcommand but username/password provided, assume create
    if not args.command and args.username and args.password:
        asyncio.run(create_admin(
            args.username,
            args.password,
            args.display_name,
            args.email
        ))
    elif args.command == "create":
        asyncio.run(create_admin(
            args.username,
            args.password,
            args.display_name,
            args.email
        ))
    elif args.command == "list":
        asyncio.run(list_admins())
    elif args.command == "delete":
        asyncio.run(delete_admin(args.username))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

