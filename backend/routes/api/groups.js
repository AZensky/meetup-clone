const express = require("express");

const { Group, User, Venue } = require("../../db/models");
const { check } = require("express-validator");
const { requireAuth } = require("../../utils/auth");
const { handleValidationErrors } = require("../../utils/validation");

const router = express.Router();

// Validates create group data
const validateCreateGroup = [
  check("name")
    .isLength({ max: 60 })
    .withMessage("Name must be 60 characters or less"),
  check("about")
    .isLength({ min: 50 })
    .withMessage("About must be 50 characters or more"),
  // console.log("****"),
  // check("type").custom((type) => {
  //   console.log(type === "In person");
  //   if (type !== "Online" && type !== "In person") {
  //     console.log("in here");
  //     return Promise.reject("Type must be Online or In person");
  //   }
  //   console.log("here");
  // }),
  check("private").isBoolean().withMessage("Private must be a boolean"),
  check("city").exists({ checkFalsy: true }).withMessage("City is required"),
  check("state").exists({ checkFalsy: true }).withMessage("State is required"),
  handleValidationErrors,
];

const validateCreateVenue = [
  check("address")
    .exists({ checkFalsy: true })
    .withMessage("Street address is required"),
  // prettier-ignore
  check("city")
  .exists({ checkFalsy: true })
  .withMessage("City is required"),
  // prettier-ignore
  check("state")
  .exists({ checkFalsy: true })
  .withMessage("State is required"),
  check("lat").custom((lat) => {
    if (lat < -90 || lat > 90) {
      throw new Error("Latitude is not valid");
    } else return true;
  }),
  check("lng").custom((lng) => {
    if (lng < -180 || lng > 180) {
      throw new Error("Longitude is not valid");
    } else return true;
  }),
  handleValidationErrors,
];

//Create a new venue for a group specified by its id
// prettier-ignore
router.post("/:groupId/venues", validateCreateVenue, requireAuth, async (req, res) => {
    const group = await Group.findByPk(req.params.groupId);

    if (!group) {
      res.status(404)
      res.json({
        message: "Group couldn't be found",
        statusCode: 404,
      });
    }

    const currUser = req.user;
    let currUserId = currUser.dataValues.id;

    console.log(currUser);

    if (group.dataValues.organizerId !== currUserId) {
      res.status(403);
      res.json({
        message:
          "You are not an owner of this group, you do are not authorized to create a venue",
        statusCode: 403,
      });
    }

    const { address, city, state, lat, lng } = req.body;

    const venue = await Venue.create({
      groupId: req.params.groupId,
      address,
      city,
      state,
      lat,
      lng,
    });

    res.json(venue);
  }
);

//Get group details of a specific group by groupId
router.get("/:groupId", async (req, res) => {
  // Need to add images array association
  let group = await Group.findByPk(req.params.groupId, {
    attributes: { exclude: ["previewImage"] },
    include: {
      model: User,
      as: "Organizer",
    },
  });

  if (!group) {
    res.status(404);
    res.json({
      message: "Group couldn't be found",
      statusCode: 404,
    });
  }

  res.json(group);
});

//Edit a group, validate the req body, check that the user owns the group
router.put("/:groupId", requireAuth, validateCreateGroup, async (req, res) => {
  const group = await Group.findByPk(req.params.groupId);

  if (!group) {
    res.status(404);
    res.json({
      message: "Group couldn't be found",
      statusCode: 404,
    });
  }

  const currUser = req.user;
  let currUserId = currUser.dataValues.id;

  if (group.dataValues.organizerId !== currUserId) {
    res.status(403);
    res.json({
      message: "Group does not belong to you",
      statusCode: 403,
    });
  }

  let { name, about, type, private, city, state } = req.body;

  await group.update({
    name,
    about,
    type,
    private,
    city,
    state,
  });

  const { numMembers, previewImage, ...groupToSend } = group.dataValues;

  res.send(groupToSend);
});

router.delete("/:groupId", requireAuth, async (req, res) => {
  const group = await Group.findByPk(req.params.groupId);

  if (!group) {
    res.status(404);
    res.json({
      message: "Group couldn't be found",
      statusCode: 404,
    });
  }

  const currUser = req.user;
  let currUserId = currUser.dataValues.id;

  if (group.dataValues.organizerId !== currUserId) {
    res.status(403);
    res.json({
      message: "Group does not belong to you",
      statusCode: 403,
    });
  }

  await group.destroy();

  res.send({
    message: "Successfully deleted",
    statusCode: 200,
  });
});

//Get all groups
router.get("/", async (req, res) => {
  let groups = await Group.findAll();
  res.json({ Groups: groups });
});

//Create a group
router.post("/", requireAuth, validateCreateGroup, async (req, res, next) => {
  let { name, about, type, private, city, state } = req.body;

  if (type !== "Online" && type !== "In person") {
    const err = new Error("Validation Error");
    err.status = 400;
    err.errors = { type: "Type must be Online or In person" };
    return next(err);
  }

  let currentUserId = req.user.dataValues.id;

  const group = await Group.create({
    organizerId: currentUserId,
    name,
    about,
    type,
    private,
    city,
    state,
  });

  res.send(group);
});

module.exports = router;
