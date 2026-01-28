/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Login.tsx                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: morgane <morgane@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/08 16:38:43 by mobonill          #+#    #+#             */
/*   Updated: 2025/11/07 18:22:01 by morgane          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// import login from '../../style/login/login.css'
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