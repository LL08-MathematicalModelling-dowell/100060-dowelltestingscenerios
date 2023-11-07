# UX Live

UX Live is a sophisticated Django application designed to facilitate live streaming from the client's camera, screen, and audio directly to the user's YouTube channel. This powerful tool is built on the Django framework, leveraging Django REST framework, Django Channels, and Google AllAuth for seamless integration and a robust streaming experience.

## Features

- **Live Streaming Capabilities:** Capture live camera, screen, and audio content from the user's device.
- **YouTube Integration:** Stream content effortlessly to the user's personal YouTube channel.
- **User Management:** Employs Google AllAuth for user authentication and account management.
- **Dynamic Channel Creation:** The application automatically generates a channel for users when initiating a stream.

## Requirements

To run UX Live, ensure you have the following installed:

- Python 3.x
- Django
- Django REST framework
- Django Channels
- Google AllAuth
- Other required dependencies can be found in the `requirements.txt` file.

## Installation

Follow these steps to set up UX Live on your local machine:

1. **Clone the repository:**

```
  git clone https://github.com/LL08-MathematicalModelling-dowell/100060-dowelltestingscenerios.git
  cd 100060-dowelltestingscenerios
```


2. **Create a virtual environment and install dependencies:**

```
virtualenv venv
source venv/bin/activate # for Unix-based systems
pip install -r requirements.txt
```
4. **Database Setup:**

```
python manage.py makemigrations
python manage.py migrate
```

4. **Configuration:**
- Obtain Google AllAuth credentials and API keys and add them to the appropriate settings file.
- Configure the application for YouTube API access.

5. **Run the development server:**

```
    python manage.py runserver
```

7. Access the application at `http://localhost:8000` in your web browser.

## Usage

1. **Sign-in:** Log in using your Google account via Google AllAuth.
2. **Start a New Stream:** Initiate a new stream from the interface.
3. **Permission Granting:** Allow necessary permissions for accessing camera, screen, and audio.
4. **YouTube Channel Setup:** Enter YouTube channel details or create a new channel.
5. **Initiate Live Stream:** Begin the live stream to start broadcasting content to the selected channel.

## Contribution Guidelines

Contributions to UX Live are highly appreciated. To contribute, follow these steps:

1. **Fork the repository** on GitHub.
2. **Create a new branch** for your feature: `git checkout -b feature-name`
3. **Make your changes** and commit them: `git commit -m 'Add feature'`
4. **Push to the branch:** `git push origin feature-name`
5. **Submit a pull request** to the main repository.

## License

This project is licensed under the [Apache License](LICENSE).

## Support

For any questions, feedback, or assistance, please contact [maintainer's email or contact information].


