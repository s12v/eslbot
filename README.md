# ESL bot

This bot helps you to learn new English words.

## Architecture

![Serverless bot architecture](https://user-images.githubusercontent.com/1462574/28251667-60201698-6a82-11e7-8f72-12459e3d4ffd.png)

ESLBot is based on the following components:

 * Amazon Lex for voice recognition and conversational interface
 * AWS Lambda for application logic and Facebook integration
 * Amazon API Gateway for providing a REST API for Facebook integration
 * FFmpeg to prepare audio for Lex
 * Amazon Polly to generate audio from text
 * Amazon S3 to cache generated speech
 * Azure SQL database to store user profiles and progress
 * Skyeng API as the data source
 * AWS CloudFormation and Serverless framework to orchestrate provisioning of AWS environment

## Usage

You can use **text or voice** input via Facebook messenger.
 
### Learn intent

The bot offers a new word with definition, audio, picture, and examples. 
earning progress is stored in database.

### Test intent

Bot offers audio definition, you need to guess a word. You have 3 attempts, after each failed attempt
bot gives you a hint. Audio is created on-demand using AWS Polly (text-to-speech) and saved to S3.

### Definition intent
 
You can ask the bot to define a word.
 
### Deployment

 * Download [ffmpeg static x64 binaries](https://www.johnvansickle.com/ffmpeg/), put `ffmpeg` to `bin`
 * You will need database (see `ddl/*`) and Facebook access details (`see .env.yml.dist`).
 * Deploy `cloudformation/*`
 * Deploy all functions with `serverless deploy`
