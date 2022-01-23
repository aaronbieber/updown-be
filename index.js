import { Router } from "itty-router"

const router = Router()

// https://www.tomspencer.dev/blog/2014/11/16/short-id-generation-in-javascript
function getId() {
var ID_LENGTH = 10;
var ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
  var rtn = '';
  for (var i = 0; i < ID_LENGTH; i++) {
    rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return rtn;
}

class Survey {
  constructor(user, prompt, id = -1, up = 0, down = 0) {
    this.user = user;
    this.prompt = prompt;
    this.id = id === -1 ? getId() : id;
    this.up = up;
    this.down = down;
  }

  getUserKey() {
    return this.user + ":" + this.id;
  }

  static fromText(jsonText) {
    let obj

    try {
      obj = JSON.parse(jsonText)
    } catch(e) {
      return false
    }

    return new this(obj.user,
                    obj.prompt,
                    obj.id,
                    obj.up,
                    obj.down)
  }
}

async function createSurvey(survey) {
  // survey record
  let ret;
  ret = await STORE.put(survey.id, JSON.stringify(survey))
  console.log(ret)

  // lookup-by-user record
  ret = await STORE.put(survey.getUserKey(), JSON.stringify(survey))
  console.log(ret)
}

router.post("/survey/create", async (request) => {
  let json = await request.json();
  let survey = new Survey(json.user,
                          json.prompt)
  createSurvey(survey);

  return new Response(JSON.stringify(json), {
    headers: new Headers({"Content-Type": "application/json"})
  })
})

router.get("/survey/:id", async ({params}) => {
  let surveyRecord = await STORE.get(params.id)
  console.log(surveyRecord)

  if (surveyRecord === null) {
    return new Response("Survey not found; is the ID correct?", { status: 404 })
  }

  return new Response(JSON.stringify(surveyRecord), {
    headers: new Headers({"Content-Type": "application/json"})
  })
})

router.post("/survey/:id/upvote", async ({params}) => {
  let surveyRecord = await STORE.get(params.id)

  if (surveyRecord === null) {
    return new Response("That is not a valid survey id. Probably.", { status: 404 })
  }

  let survey = Survey.fromText(surveyRecord)
  survey.up += 1;
  console.log(survey)

  let ret = await STORE.put(survey.id, JSON.stringify(survey))
  return new Response("OK")
})

router.post("/survey/:id/downvote", async ({params}) => {
  let surveyRecord = await STORE.get(params.id)

  if (surveyRecord === null) {
    return new Response("That is not a valid survey id. Probably.", { status: 404 })
  }

  let survey = Survey.fromText(surveyRecord)
  survey.down += 1;
  console.log(survey)

  let ret = await STORE.put(survey.id, JSON.stringify(survey))
  return new Response("OK")
})

router.get("/user/:email/surveys", async ({params}) => {
  let prefix = params.email + ":"
  let surveys = await STORE.list({"prefix": prefix})

  if (!surveys.keys.length) {
    return new Response("No surveys found for that user ID", { status: 404 })
  }

  console.log(JSON.stringify(surveys.keys))

  let fullSurveys = await Promise.all(
    surveys.keys.map(async (s) => {
      let key = s.name.split(":")[1]
      let record = await STORE.get(key)
      return record
    }));

  return new Response(JSON.stringify(fullSurveys), {
    headers: new Headers({"Content-Type": "application/json"})
  })
})

addEventListener("fetch", event => {
  event.respondWith(router.handle(event.request))
})
