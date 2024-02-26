import secrets


def generate_api_key():
    """Generate a random api key"""
    return secrets.token_hex(20)