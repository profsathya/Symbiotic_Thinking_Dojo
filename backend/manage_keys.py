#!/usr/bin/env python3
"""CLI tool for managing CTI keys."""

import csv
import sys
import uuid
from typing import Optional

import click

import database


@click.group()
def cli():
    """CTI Key Management Tool for the Symbiotic Thinking Dojo."""
    database.init_db()


@cli.command()
@click.option("--email", required=True, help="Student email address")
@click.option("--name", default=None, help="Student name")
@click.option("--budget", default=5_000_000, help="Total token budget (default: 5000000)")
@click.option("--expires", default=None, help="Expiration date (YYYY-MM-DD)")
@click.option("--notes", default=None, help="Optional notes")
def create(email: str, name: Optional[str], budget: int, expires: Optional[str], notes: Optional[str]):
    """Create a single CTI key for a student."""
    key_id = str(uuid.uuid4())
    database.create_key(
        key_id=key_id,
        student_email=email,
        student_name=name,
        total_budget_tokens=budget,
        expires_at=expires,
        notes=notes,
    )
    click.echo(f"Created key for {email}:")
    click.echo(f"  Key:     {key_id}")
    click.echo(f"  Budget:  {budget:,} tokens")
    if expires:
        click.echo(f"  Expires: {expires}")


@cli.command("bulk-create")
@click.option("--csv-file", "csv_path", required=True, help="CSV file with columns: email, name")
@click.option("--budget", default=5_000_000, help="Total token budget per student")
@click.option("--expires", default=None, help="Expiration date (YYYY-MM-DD)")
@click.option("--output", default=None, help="Output CSV path (default: stdout)")
def bulk_create(csv_path: str, budget: int, expires: Optional[str], output: Optional[str]):
    """Bulk create keys from a CSV file (columns: email, name)."""
    results = []
    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row["email"].strip()
            name = row.get("name", "").strip() or None
            key_id = str(uuid.uuid4())
            database.create_key(
                key_id=key_id,
                student_email=email,
                student_name=name,
                total_budget_tokens=budget,
                expires_at=expires,
            )
            results.append({
                "email": email,
                "name": name or "",
                "key": key_id,
                "budget": budget,
                "expires": expires or "",
            })

    # Write output
    out = open(output, "w", newline="") if output else sys.stdout
    writer = csv.DictWriter(out, fieldnames=["email", "name", "key", "budget", "expires"])
    writer.writeheader()
    writer.writerows(results)
    if output:
        out.close()
        click.echo(f"Created {len(results)} keys. Output written to {output}")
    else:
        click.echo(f"\nCreated {len(results)} keys.", err=True)


@cli.command("list")
@click.option("--active-only", is_flag=True, help="Show only active keys")
def list_keys(active_only: bool):
    """List all CTI keys with usage summary."""
    keys = database.list_keys(active_only=active_only)
    if not keys:
        click.echo("No keys found.")
        return

    click.echo(f"{'Email':<30} {'Name':<20} {'Used/Total':<20} {'Active':<8} {'Last Used':<20}")
    click.echo("-" * 100)
    for k in keys:
        used = k["used_tokens_input"] + k["used_tokens_output"]
        total = k["total_budget_tokens"]
        pct = (used / total * 100) if total > 0 else 0
        click.echo(
            f"{k['student_email']:<30} "
            f"{(k['student_name'] or ''):<20} "
            f"{used:>8,}/{total:>8,} ({pct:4.1f}%) "
            f"{'Yes' if k['active'] else 'No':<8} "
            f"{k['last_used_at'] or 'Never':<20}"
        )


@cli.command()
@click.option("--email", required=True, help="Student email to look up")
def usage(email: str):
    """Show detailed usage for a specific student."""
    keys = database.list_keys()
    matches = [k for k in keys if k["student_email"] == email]
    if not matches:
        click.echo(f"No keys found for {email}")
        return

    for k in matches:
        used = k["used_tokens_input"] + k["used_tokens_output"]
        remaining = max(0, k["total_budget_tokens"] - used)
        click.echo(f"Key:            {k['id']}")
        click.echo(f"Student:        {k['student_name'] or 'N/A'} ({k['student_email']})")
        click.echo(f"Input tokens:   {k['used_tokens_input']:,}")
        click.echo(f"Output tokens:  {k['used_tokens_output']:,}")
        click.echo(f"Total used:     {used:,}")
        click.echo(f"Budget:         {k['total_budget_tokens']:,}")
        click.echo(f"Remaining:      {remaining:,}")
        click.echo(f"Active:         {'Yes' if k['active'] else 'No'}")
        click.echo(f"Created:        {k['created_at']}")
        click.echo(f"Expires:        {k['expires_at'] or 'Never'}")
        click.echo(f"Last used:      {k['last_used_at'] or 'Never'}")
        click.echo()


@cli.command()
@click.option("--key", "key_id", required=True, help="Key ID to deactivate")
def deactivate(key_id: str):
    """Deactivate a CTI key."""
    key_data = database.get_key(key_id)
    if not key_data:
        click.echo(f"Key not found: {key_id}")
        return
    database.set_key_active(key_id, False)
    click.echo(f"Deactivated key for {key_data['student_email']}")


@cli.command()
@click.option("--key", "key_id", required=True, help="Key ID to reactivate")
def reactivate(key_id: str):
    """Reactivate a CTI key."""
    key_data = database.get_key(key_id)
    if not key_data:
        click.echo(f"Key not found: {key_id}")
        return
    database.set_key_active(key_id, True)
    click.echo(f"Reactivated key for {key_data['student_email']}")


@cli.command("add-budget")
@click.option("--key", "key_id", required=True, help="Key ID")
@click.option("--tokens", required=True, type=int, help="Tokens to add")
def add_budget(key_id: str, tokens: int):
    """Add tokens to a key's budget."""
    key_data = database.get_key(key_id)
    if not key_data:
        click.echo(f"Key not found: {key_id}")
        return
    database.add_budget(key_id, tokens)
    new_total = key_data["total_budget_tokens"] + tokens
    click.echo(f"Added {tokens:,} tokens to key for {key_data['student_email']}")
    click.echo(f"New total budget: {new_total:,}")


@cli.command("export-usage")
@click.option("--csv-file", "csv_path", required=True, help="Output CSV file path")
def export_usage(csv_path: str):
    """Export all usage data to CSV."""
    keys = database.list_keys()
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "key_id", "email", "name", "input_tokens", "output_tokens",
            "total_used", "budget", "remaining", "active", "created", "expires", "last_used",
        ])
        writer.writeheader()
        for k in keys:
            used = k["used_tokens_input"] + k["used_tokens_output"]
            writer.writerow({
                "key_id": k["id"],
                "email": k["student_email"],
                "name": k["student_name"] or "",
                "input_tokens": k["used_tokens_input"],
                "output_tokens": k["used_tokens_output"],
                "total_used": used,
                "budget": k["total_budget_tokens"],
                "remaining": max(0, k["total_budget_tokens"] - used),
                "active": k["active"],
                "created": k["created_at"],
                "expires": k["expires_at"] or "",
                "last_used": k["last_used_at"] or "",
            })
    click.echo(f"Exported {len(keys)} keys to {csv_path}")


if __name__ == "__main__":
    cli()
