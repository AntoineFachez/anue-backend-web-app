// functions/api/dataRoutes.js
const express = require("express");
const {
  getPaginatedDocs,
  getDocFromCollection,
  searchStoryScriptEventLinks,
  echo,
  // getAllDocs,
} = require("../controllers/dataController");

const router = express.Router();

//* --- Search Links ---
router.get("/story_script_event_links/search", searchStoryScriptEventLinks);

//* --- Pagination ---
router.get(
  "/story_script_event_links",
  getPaginatedDocs("story_script_event_links"),
);
router.get("/event_entity_links", getPaginatedDocs("event_entity_links"));
router.get("/stories", getPaginatedDocs("stories"));
router.get("/scripts", getPaginatedDocs("scripts"));
router.get("/events", getPaginatedDocs("events"));
router.get("/entities", getPaginatedDocs("entities"));
router.get("/locations", getPaginatedDocs("locations"));

//* --- By docId ---
router.get(
  "/story_script_event_links/:docId",
  getDocFromCollection("story_script_event_links"),
);
router.get(
  "/event_entity_links/:docId",
  getDocFromCollection("event_entity_links"),
);
router.get("/stories/:docId", getDocFromCollection("stories"));
router.get("/scripts/:docId", getDocFromCollection("scripts"));
router.get("/events/:docId", getDocFromCollection("events"));
router.get("/entities/:docId", getDocFromCollection("entities"));
router.get("/locations/:docId", getDocFromCollection("locations"));

//* --- Misc ---
router.post("/echo", echo);

module.exports = router;
