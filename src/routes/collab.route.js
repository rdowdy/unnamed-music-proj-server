var express = require("express");
var router = express.Router();
var passport = require('passport');
var Collab = require("../models/collab");
var User = require("../models/user");
var Sound = require("../models/sound");

router.route("/")

	//GET: /collabs
	.get(function(req, res) {
		Collab
			.find()
			.populate('userIds', '_id username')
			.exec(function(err, collabs) {
				if(err) {
					return res.send(500, err);
				}

				res.json(collabs);
			})
	})

	//POST: /collabs
	.post(function(req, res) {
		var collab = new Collab();

		collab.startDate = req.body.startDate;
		collab.completed = req.body.completed;

		collab.save(function(err, collab) {
			if(err) {
				return res.send(500, err);
			}

			res.json(collab);
		})
	})

router.route("/:id")	
	//GET: /collabs/:id
	.get(function(req, res) {
		Collab
			.findById(req.params.id)
			.populate('userIds', '_id username')
			.populate('soundIds')
			.exec(function(err, collab) {
				if(err) {
					return res.send(500, err);
				}

				res.json(collab);
			});
	})

	//PUT: /collabs/:id
	.put(function(req, res) {
		Collab.findById(req.params.id, function(err, collab) {
			if(err) {
				return res.send(500, err);
			}

			collab.startDate = req.body.startDate;
			collab.completed = req.body.completed;

			collab.save(function(err, savedCollab) {
				if(err) {
					return res.send(500, err);
				}

				res.json(savedCollab);
			})
		});
	})

	//DELETE: /collabs/:id
	.delete(function(req, res) {
		Collab.remove({_id: req.params.id}, function(err, collab) {
			if(err) {
				return res.send(500, err);
			}

			res.json(collab);
		})
	});

router.route("/:collabId/:userId")
	//POST: /collabs/:collabId/:userId
	.post(function(req, res) {
		// TODO: check to make sure that the post request
		// is coming from a user that's already on the 
		// collab
		Collab.findById(req.params.collabId, function(err, collab) {
			if(err) {
				return res.send(500, err);
			}

			User.findById(req.params.userId, function(err, user) {
				if(err) {
					return res.send(500, err);
				}

				collab.userIds.push(user._id);
				user.collabIds.push(collab._id);
				collab.save(function(err, collab) {
					if(err) {
						return res.send(500, err);
					}

					user.save(function(err, user) {
						res.json(collab);
					})
				});
			})
		})
	})

	//DELETE: /collabs/:collabId/:userId
	.delete(function(req, res) {
		Collab.findById(req.params.collabId, function(err, collab) {
			if(err) {
				return res.send(500, err);
			}

			User.findById(req.params.userId, function(err, user) {
				if(err) {
					return res.send(500, err);
				}

				var idx = collab.userIds.indexOf(user._id);
				collab.userIds.splice(idx, 1);
				collab.save(function(err, collab) {
					res.json(collab);
				});
			})
		})
	})

router.route("/:collabId/sounds/:soundId")
	.post(function(req, res) {
		Collab.findById(req.params.collabId, function(err, collab) {
			if(err) {
				return res.send(500, err);
			}

			Sound.findById(req.params.soundId, function(err, sound) {
				if(err) {
					return res.send(500, err);
				}

				collab.soundIds.push(sound._id);
				sound.collabId = collab._id;
				sound.save(function(err, sound) {
					if(err) {
						return res.send(500, err);
					}

					collab.save(function(err, collab) {
						res.json(collab);
					})
				})
			})
		})
	});
module.exports = router;