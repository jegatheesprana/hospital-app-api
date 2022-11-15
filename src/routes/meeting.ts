import {Router, Request, Response} from 'express'
import jwt, { Secret, JwtPayload, SignOptions, DecodeOptions } from 'jsonwebtoken'
import { Appointment } from "../models/appointment.model";
import fetch from 'node-fetch';

const router: Router = Router();

router.get("/get-token", (req: Request, res: Response) => {
    const API_KEY = process.env.VIDEOSDK_API_KEY as string;
    const SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY as string;
  
    const options: SignOptions = { expiresIn: "10m", algorithm: "HS256" };
  
    const payload = {
      apikey: API_KEY,
      permissions: ["allow_join", "allow_mod"], // also accepts "ask_join"
    };
  
    const token = jwt.sign(payload, SECRET_KEY, options);
    res.json({ token });
  });
  
  //
router.post("/create-meeting/", (req: Request, res: Response) => {
    const { token, region } = req.body;
    const url = `${process.env.VIDEOSDK_API_ENDPOINT}/api/meetings`;
    const options = {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({ region }),
    };
  
    fetch(url, options)
      .then((response: any) => response.json())
      .then((result: any) => res.json(result)) // result will contain meetingId
      .catch((error: any) => console.error("error", error));
  });
  
  //
router.get("/validate-meeting/:meetingId", (req: Request, res: Response) => {
    const token = req.body.token;
    const meetingId = req.params.meetingId;
  
    // const url = `${process.env.VIDEOSDK_API_ENDPOINT}/api/meetings/${meetingId}`;
  
    // const options = {
    //   method: "POST",
    //   headers: { Authorization: token },
    // };
  
    // fetch(url, options)
    //   .then((response: any) => response.json())
    //   .then((result: any) => res.json(result)) // result will contain meetingId
    //   .catch((error: any) => console.error("error", error));

    Appointment.findOne({ meetingId }).then((appointment) => {
      if (appointment) {
        // Get current dateTime
        const date = new Date()
        let currDateTime = date.getFullYear().toString()
        const month = date.getMonth() + 1
        const day = date.getDate()
        const hour = date.getHours()
        const minutes = date.getMinutes()
        const seconds = date.getSeconds()

        currDateTime += month < 10 ? ('-0' + month.toString()) : '-' + month.toString()
        currDateTime += day < 10 ? ('-0' + day.toString()) : '-' + day.toString()
        currDateTime += hour < 10 ? ('T0' + hour.toString()) : 'T' + hour.toString()
        currDateTime += minutes < 10 ? (':0' + minutes.toString()) : ':' + minutes.toString()
        currDateTime += seconds < 10 ? (':0' + seconds.toString()) : ':' + seconds.toString()

        const meetingStarted = Date.parse(currDateTime) >= Date.parse(appointment.date + 'T' + appointment.slotTime)
        const meetingEnded = Date.parse(currDateTime) >= (Date.parse(appointment.date + 'T' + appointment.slotTime)+30*60000)

          res.json({
            valid: true,
            meetingStarted,
            meetingEnded,
            appointment
          })
      } else {
        res.json({
          valid: false
        })
      }
  })
});

router.get("/time-left/:meetingId", (req: Request, res: Response) => {
  const token = req.body.token;
  const meetingId = req.params.meetingId;

  Appointment.findOne({ meetingId }).then((appointment) => {
    if (appointment) {
      // Get current dateTime
      const date = new Date()
      let currDateTime = date.getFullYear().toString()
      const month = date.getMonth() + 1
      const day = date.getDate()
      const hour = date.getHours()
      const minutes = date.getMinutes()
      const seconds = date.getSeconds()

      currDateTime += month < 10 ? ('-0' + month.toString()) : '-' + month.toString()
      currDateTime += day < 10 ? ('-0' + day.toString()) : '-' + day.toString()
      currDateTime += hour < 10 ? ('T0' + hour.toString()) : 'T' + hour.toString()
      currDateTime += minutes < 10 ? (':0' + minutes.toString()) : ':' + minutes.toString()
      currDateTime += seconds < 10 ? (':0' + seconds.toString()) : ':' + seconds.toString()

      const timeLeft = Date.parse(appointment.date + 'T' + appointment.slotTime) - (Date.parse(currDateTime)-30*60000)

        res.json({
          valid: true,
          timeLeft
        })
    } else {
      res.json({
        valid: false
      })
    }
})
});

export default router;