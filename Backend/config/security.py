from passlib.context import CryptContext

# Set up password hashing algorithm (Bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """
    Hash a plain-text password using Bcrypt.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a hashed one.
    """
    return pwd_context.verify(plain_password, hashed_password)
