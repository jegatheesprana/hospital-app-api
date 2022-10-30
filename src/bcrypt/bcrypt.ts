function hash(plainTextPassword: string, salt: string) {
	return (plainTextPassword + "," + salt).split(',')[0]
}

function compare(encryptedPassword: string, actualPassword: string) {
	return hash(encryptedPassword, process.env.PASSWORD_SALT as string) === actualPassword
}

export{
	hash,
	compare
}