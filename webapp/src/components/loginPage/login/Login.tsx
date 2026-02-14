import Button42 from '../login/utils/Button42'

export default function Login() {

	return (
		<div className="login">
			<a href={`https://localhost:8443/auth/42/login`}>
			<Button42/>
			</a>
		</div>
	)
}