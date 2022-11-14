import {Router, Request, Response} from 'express'
import jwt, { Secret, JwtPayload, SignOptions, DecodeOptions } from 'jsonwebtoken'
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
router.post("/validate-meeting/:meetingId", (req: Request, res: Response) => {
    const token = req.body.token;
    const meetingId = req.params.meetingId;
  
    const url = `${process.env.VIDEOSDK_API_ENDPOINT}/api/meetings/${meetingId}`;
  
    const options = {
      method: "POST",
      headers: { Authorization: token },
    };
  
    fetch(url, options)
      .then((response: any) => response.json())
      .then((result: any) => res.json(result)) // result will contain meetingId
      .catch((error: any) => console.error("error", error));
  });

export default router;