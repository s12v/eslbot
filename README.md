# ESL bot

This bot helps you to learn new English words.

https://user-images.githubusercontent.com/1462574/28089437-4b814196-6689-11e7-920e-f76acddda08b.png

It's build with AWS Lex, Polly, API Gateway, S3, and Lambda.
Resources created and deployed with CloudFormation and [Serverless](https://serverless.com).
Words search and user profiles stored in Azure SQL database.
The bot is connected to Facebook Messenger Platform.

Many thanks to [skyeng.ru](https://skyeng.ru) for providing public API and allowing to use data.

## Usage

You can use **text or voice** input via Facebook messenger.
 
### Learn intent

The bot offers a new word with definition, audio, picture, and examples.
Learning progress is stored in database.

### Test intent

Bot offers definition and picture, and you need to guess a word.
When audio is not available, it's created on-demand using AWS Polly (text-to-speech) and saved to S3.

### Definition intent
 
You can ask the bot to define a word.
 
### Deployment

 * Download ffmpeg static x64 binaries from https://www.johnvansickle.com/ffmpeg/, put `ffmpeg` to `bin`
 * You will need database (see `ddl/*`) and Facebook access details (`see .env.yml.dist`).
 * Deploy `cloudformation/*`
 * Deploy functions with `serverless deploy`
