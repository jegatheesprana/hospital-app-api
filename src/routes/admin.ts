import {Router, Request, Response} from 'express'
import jwt, { Secret, SignOptions } from 'jsonwebtoken'


const router: Router = Router();

router.route("/login").post(async (req: Request, res: Response) => {
	try {
		const username = req.body.username;
		const password = req.body.password;

		if (username !== 'admin@admin.com' || password !== 'Admin@1234') {
			return res.status(201).json({ message: "wrong username or password" });
		}

		// Doctor found, return the token to the client side
		const token = jwt.sign(
			JSON.stringify({type: 'admin'}),
			process.env.KEY as Secret, 
			{
				algorithm: process.env.ALGORITHM as string,
			} as SignOptions
		);

		return res.status(200).json({ token: token.toString(), user: { type: 'admin'} });

	} catch (err) {
		console.log(err);
		return res.status(400).json(err);
	}
});


export default router;