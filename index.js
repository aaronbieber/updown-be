import { Router } from "itty-router"

const router = Router()

router.post("/thing/save", async request => {
  let json = await request.json();

  console.log(json.thing)
  await STORE.put("thing", json.thing)

  return new Response("OK")
})

router.get("/thing", async () => {
  let ret = await STORE.get("thing")
  console.log("val " + ret)
  console.log("foo = " + await STORE.get("foo"))

  // return new Response("Alright")
  return new Response(ret)
})

addEventListener("fetch", event => {
  event.respondWith(router.handle(event.request))
})
