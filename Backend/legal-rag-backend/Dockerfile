# Start from a standard Python image
FROM python:3.11-slim

# Install the system libraries WeasyPrint needs
RUN apt-get update && apt-get install -y libgtk-3-0

# Set up our working directory
WORKDIR /app

# Copy requirements first for Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of our project code
COPY . .

# Expose the port your app will run on
EXPOSE 8080

# The command to run your main app.py
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]