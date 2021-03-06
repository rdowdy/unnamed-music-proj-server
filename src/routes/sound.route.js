var fs = require("fs");
var express = require("express");
var router = express.Router();
var Sound = require("../models/sound");
var Track = require("../models/track");

var soundFilePath = "server/sounds/";

router.route("/")

	//GET: /sounds
	.get(function(req, res) {
		Sound.find(function(err, sound) {
			if(err) {
				return res.send(500, err);
			}

			res.json(sound);
		})
	})

	//POST: /sounds
	.post(function(req, res) {
		var sound = new Sound();

		sound.track = req.body.track;
		sound.gridLocation = req.body.gridLocation;
		sound.frameLength = req.body.frameLength;
		sound.fps = req.body.fps;
		sound.startMarker = req.body.startMarker;
		sound.endMarker = req.body.endMarker;
		sound.trackId = req.body.trackId;

		sound.save(function(err, sound) {
			if(err) {
				return res.send(500, err);
			}

			sound.filePath = sound._id + ".pcm";

			sound.save(function(err, sound) {
				Track.findById(req.body.trackId, function(err, track) {
					if(err) {
						return res.send(500, err);
					}

					track.soundIds.push(sound);

					track.save(function(err, track) {
						res.json(sound);
					})
				});
			});
		})
	})

router.route("/:id")

	//GET: /sounds/:id
	.get(function(req, res) {
		Sound.findById(req.params.id, function(err, sound) {
			if(err) {
				return res.send(500, err);
			}

			if(sound == null) {
				return res.json(400, req.params.id);
			}

			// // attach PCM data to sound object
			fs.open(soundFilePath + sound.filePath, 'r', function(err, fd) {
				if(err) {
					return res.json(500, err);
				}

				var buffer = [];
				var done = false;
				var i = 0;
				var readBuf;
				while(!done) {
					readBuf = new Buffer(16);
					var numRead = fs.readSync(fd, readBuf, 0, 16, null);

					if(numRead == 0) {
						done = true;
						break;
					}

					buffer.push(readBuf.readFloatBE(0));
				}

				sound.buffer = buffer;
				res.json(200, {sound: sound, buffer: buffer});
			});

		})
	})

	//PUT: /sounds/:id
	.put(function(req, res) {
		Sound.findById(req.params.id, function(err, sound) {
			if(err) {
				return res.send(500, err);
			}

			sound.track = req.body.track;
			sound.gridLocation = req.body.gridLocation;
			sound.startMarker = req.body.startMarker;
			sound.endMarker = req.body.endMarker;
			sound.trackId = req.body.trackId;
			sound.fps = req.body.fps;
			sound.frameLength = req.body.frameLength;

			sound.save(function(err, savedSound) {
				if(err) {
					return res.send(500, err);
				}

				res.json(savedSound);
			})	
		})
	})

	//DELETE: /sounds/:id
	.delete(function(req, res) {
		// find and remove the sound document from DB
		Sound.findOneAndRemove({_id: req.params.id}, function(err, sound) {
			if(err) {
				return res.send(500, err);
			}

			// delete the PCM file
			fs.unlink("server/sounds/" + sound.filePath, function(err) {
				if(err) {
					console.log(err);
				}
			})

			// remove the track->sound relationship
			Track.findById(sound.trackId, function(err, track) {
				if(err) {
					return res.send(500, err);
				}

				var idx = track.soundIds.indexOf(sound._id);
				track.soundIds.splice(idx, 1);
				track.save(function(err, track) {
					if(err) {
						return res.send(500, err);
					}

					res.json(sound);
				})

			})

		})
	})

module.exports = router;