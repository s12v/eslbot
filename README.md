# ESL bot

This bot can help you to learn new English words.

It's build with AWS Lex, Polly, API Gateway, S3, and Lambda.
Resources created and deployed with Cloud Formation and Serverless.
Words search and user profiles stored in Azure SQL database.
The bot is connected to Facebook Messenger Platform.
Many thanks to SkyEng, which is used as a data source, for offering a public API.

... architecture image


## Usage
 
### Learn intent

The bot offers a new word with definition, audio, picture, and examples.
When audio is not available, it's created on-demand using AWS Polly (text-to-speech).
Learning progress is stored in database.

### Test intent

Bot offers definition and picture, and you need to guess a word.
You can use **text or voice** input. AWS Lex is used for speech recognition.

### Definition intent
 
You can ask the bot to define a word.
 
## Development

The bot is built using node.js and Serverless framework
 
### Deployment

You will need database (see `ddl/*`) and API credentials (`see .env.yml.dist`).
Deploy `cloudformation/*` first and follow with `serverless deploy`.

