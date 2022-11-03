import bcrypt from 'bcrypt'

async function hash(plainTextPassword: string) {
	// Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainTextPassword, salt);
	return hashedPassword
}

function compare(givenPassword: string, actualPassword: string) {
	return bcrypt.compare(givenPassword, actualPassword)
}

export{
	hash,
	compare
}