
var keys = require('./keys.js');
var Twitter = require('twitter');
var Spotify = require('node-spotify-api');
var request = require('request');
var fs = require('fs');

var arg = "";

arg = process.argv[3];

parseCommand(process.argv[2], arg);

function parseCommand(command, arg) {
	switch (command) {

	case "my-tweets":
		getTweets();
		break;

	case "spotify-this-song":
		spotifySong(arg);
		break;

	case "movie-this":
		movieInfo(arg);
		break;

	case "do-what-it-says":
		parseFileCommand();
		break;

	case undefined:
	case "":
		console.log("Please try another command.");
		break;

	default:
		console.log("Command not valid.");
		break;

	}
};

function getTweets() {
	var twitter = new Twitter(keys.twitterKeys);
	twitter.get('statuses/home_timeline', function(error, tweets, response) {
		if (tweets.length < 1) {
			console.log("No tweets from your account.");
			return;
		}
		if (tweets.length === 1) {
			console.log("Here is your only tweet:\n");
		} else {
			console.log("Here are your most recent tweets:\n");
		}
		
		for (var i = 0; i < tweets.length; i++) {
			var tweetTime = tweets[i].created_at;
			tweetTime = tweetTime.substring(tweetTime.indexOf(' ') + 1);
			var month = tweetTime.substring(0, tweetTime.indexOf(' '));
			tweetTime = tweetTime.substring(tweetTime.indexOf(' ') + 1);
			var day = tweetTime.substring(0, tweetTime.indexOf(' '));
			tweetTime = tweetTime.substring(tweetTime.indexOf(' ') + 1);
			var time = tweetTime.substring(0, tweetTime.indexOf(' '));
			tweetTime = tweetTime.substring(tweetTime.indexOf(' ') + 1);
			tweetTime = tweetTime.substring(tweetTime.indexOf(' ') + 1);
			var year = tweetTime.substring(tweetTime.indexOf(' '));

			var hours = parseInt(time.substring(0, time.indexOf(':')));
			time = time.substring(time.indexOf(':') + 1);
			var minutes = time.substring(0, time.indexOf(':'));
			time = (hours % 12 === 0 ? 12 : hours % 12) + ':' + minutes + (hours >= 12 && hours < 24 ? 'pm' : 'am');

			var tweet = '  <' + month + " " + day + " " + year + " @ " + time + "> \"" + tweets[i].text + "\"";
			console.log(tweet);
		}
	});
};

function spotifySong(song) {
	song = (song || "The Sign");
	var spotify = new Spotify(keys.spotifyKeys);
	spotify.search({ type: 'track', query: "track:" + song, limit: 20 })
	.then(function(response) {
		var foundSong = false;
		for (var i = 0; i < response.tracks.items.length; i++) {
			if (response.tracks.items[i].name.toLowerCase() === song.toLowerCase()) {
				console.log("Song Found:\n");
				if (response.tracks.items[i].artists.length > 0) {
					var artists = response.tracks.items[i].artists.length > 1 ? "  Artists: " : "  Artist: ";
					for (var j = 0; j < response.tracks.items[i].artists.length; j++) {
						artists += response.tracks.items[i].artists[j].name;
						if (j < response.tracks.items[i].artists.length - 1) {
							artists += ", ";
						}
					}
					console.log(artists);
				}
				console.log("  Song: " + response.tracks.items[i].name);
				console.log("  Album: " + response.tracks.items[i].album.name);
				console.log(response.tracks.items[i].preview_url ? "  Preview: " + response.tracks.items[i].preview_url : "  No Preview Available");

				foundSong = true;
				break;
			}
		}
		if (!foundSong) {
			console.log("Couldn't find any songs called '" + song + "' on Spotify.");
		}
	})
	.catch(function(err) {
	    console.log("Error with Spotify.\n  " + err);
	});
};

function movieInfo(movie) {
	movie = movie || "Mr. Nobody";
	var queryUrl = "https://www.omdbapi.com/?apikey=40e9cece&s=" + movie;
	request(queryUrl, function (error, response, body) {
		if (error) {
			console.log("Error with movies.\n  " + error);
			return;
		}
		if (body && JSON.parse(body).Search && JSON.parse(body).Search.length > 0) {
			for (var i = 0; i < JSON.parse(body).Search.length; i++) {
				var result = JSON.parse(body).Search[i];
				if (result.Title.toLowerCase() === movie.toLowerCase()) {
		            var cont = false;
					var innerQueryURL = "https://www.omdbapi.com/?i=" + result.imdbID + "&apikey=40e9cece";
					request(innerQueryURL, function (error, response, body) {
						if (error) {
							console.log("Error with movies.\n  " + error);
							return;
						}
						if (body && JSON.parse(body) && JSON.parse(body).Response === "True") {
							body = JSON.parse(body);
							console.log("Movie result:\n");
							console.log("  Title: " + body.Title);
							console.log("  Year: " + body.Year);
							for (var j = 0; j < body.Ratings.length; j++) {
								if (body.Ratings[j].Source === "Internet Movie Database") {
									console.log("  IMDB Rating: " + body.Ratings[j].Value);
								} else if (body.Ratings[j].Source === "Rotten Tomatoes") {
									console.log("  Rotten Tomatoes Score: " + body.Ratings[j].Value);
								}
							}
							console.log("  " + (body.Country.indexOf(',') < 0 ? "Country: " : "Countries: ") + body.Country);
							console.log("  " + (body.Language.indexOf(',') < 0 ? "Language: " : "Languages: ") + body.Language);
							console.log("  Actors: " + body.Actors);
							console.log("  Plot: " + body.Plot);
						} else {
							cont = true;
						}
					});
					if (cont) {
						continue;
					}
					return;
				}
			}
			var result = JSON.parse(body).Search[0];
			var innerQueryURL = "https://www.omdbapi.com/?i=" + result.imdbID + "&apikey=40e9cece";
			var ret = false;
			request(innerQueryURL, function (error, response, body) {
				if (error) {
					console.log("Error in movies.\n  " + error);
					return;
				}
				if (body && JSON.parse(body) && JSON.parse(body).Response === "True") {
					body = JSON.parse(body);
					console.log("Closes movie matching description:\n");
					console.log("  Title: " + body.Title);
					console.log("  Year: " + body.Year);
					for (var j = 0; j < body.Ratings.length; j++) {
						if (body.Ratings[j].Source === "Internet Movie Database") {
							console.log("  IMDB Rating: " + body.Ratings[j].Value);
						} else if (body.Ratings[j].Source === "Rotten Tomatoes") {
							console.log("  Rotten Tomatoes Score: " + body.Ratings[j].Value);
						}
					}
					console.log("  " + (body.Country.indexOf(',') < 0 ? "Country: " : "Countries: ") + body.Country);
					console.log("  " + (body.Language.indexOf(',') < 0 ? "Language: " : "Languages: ") + body.Language);
					console.log("  Actors: " + body.Actors);
					console.log("  Plot: " + body.Plot);
				} else {
					ret = true;
				}
			});
			if (ret) {
				return;
			}
		} else {
			console.log("Could not find movies called: '" + movie + "'.");
		}
	});
};

function parseFileCommand() {
	fs.readFile("random.txt", "utf8", function(error, data) {
		if (error) {
			return console.log("Error.\n  " + error);
		}
		var dataArr = data.split(",");
		parseCommand(dataArr[0], dataArr[1].replace(/"/g, ""));
	});
};