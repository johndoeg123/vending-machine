const twitter = require('twitter');
const config = require('./config.js').twitterConfig;

const client = new twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: config.access_token_key,
    access_token_secret: config.access_token_secret
});

function getTweets() {

    client.get('statuses/user_timeline', (error, tweets, response) => {
        if (error) console.log(error);

        tweets.map((tweet) => {
            console.log(tweet.text);
        })

    });

}

function postTweet(text) {
    let now = new Date();
    var tweetText = text + '    (' + now.toLocaleString('de-DE') + ')'
    client.post('statuses/update', { status: tweetText }, (error, tweet, response) => {
        if (error) console.log(error);
        console.log(tweet.text);  // Tweet Text. 
    });

}

module.exports.getTweets = getTweets;
module.exports.postTweet = postTweet;