FROM python:latest

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY . /app/

ENV PATH="/app/venv/bin:$PATH"

# RUN pip install -r requirements.txt

# RUN ls -la

# RUN find . -type f -exec grep -H 'oauth_data' {} +

EXPOSE 8000

RUN python manage.py makemigrations

RUN python manage.py migrate

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]