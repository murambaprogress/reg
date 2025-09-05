"""Customers app - lightweight wrappers for customer APIs that use the Customer model.
This app intentionally re-uses the Customer model currently defined in the inventory app to
avoid introducing duplicate DB tables. It provides a separate URL namespace for customer
APIs so the customers feature lives in its own app directory.
"""
