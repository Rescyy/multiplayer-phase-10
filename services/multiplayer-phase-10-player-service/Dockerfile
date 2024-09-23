FROM python:3.12.6
WORKDIR /usr/src/player-service
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src
CMD ["python", "src/main.py"]