# SETUP

## PostgreSQL: Create Role and Database (Local)

Essential steps to create the app role and database, then connect.

### 1) Open the superuser shell (Linux)

```bash
sudo -u postgres psql
```

###2) Create role and database (run inside psql)

```sql
CREATE ROLE caltutors WITH LOGIN PASSWORD 'yourStrongPassword';
CREATE DATABASE caltutors_app_db OWNER caltutors;
```

### 3) Quit and connect as the app user

```bash
\q
psql -U caltutors -d caltutors_app_db -h 127.0.0.1 -p 5432
```

## Environment variables

```bash
DATABASE_URL="postgresql://caltutors:yourStrongPassword@127.0.0.1:5432/caltutors_app_db"
# for debug logs in console (useful during prod)
LOG_LEVEL=DEBUG
DJANGO_ALLOWED_HOSTS=localhost
DJANGO_SECRET_KEY='ASK JOSHUA'
```

## UV/Django Commands

```bash
# to add dependences
uv add package_name

# to make migrations
uv run manage.py makemigrations
uv run manage.py migrate

# to run the dev server
uv run manage.py runserver

# tests
uv run manage.py test

# to start an app
uv run manage.py startapp tutors apps/tutors
```
