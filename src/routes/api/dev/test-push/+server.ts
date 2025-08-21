import { NODE_ENV } from '$env/static/private';
import { getUrl } from '$lib/media';
import { broadcastNewPostNotification } from '$lib/push-notifications/push.server';
import { error, json } from '@sveltejs/kit';

export async function POST() {
	if (NODE_ENV !== 'development') {
		throw error(403, 'Unauthorized');
	}
	await broadcastNewPostNotification({
		title: '*1 год взрослой жизни:* Мне исполнилось 19 лет!',
		message:
			'Переезд из России, поездка в Казахстан, костюмированный Хэллоуин у меня дома, 3 города России, Шанхай, Китай, гик-трип, почти оффер в Австралию и birthday party в Майнкрафте: как я провел первый год взрослой жизни и 19 день рождения.',
		postedAt: Date.now(),
		image: getUrl('8b0a2720-1d46-424e-8f8c-85f4348d13f5.jpeg'),
		url: 'https://blog.hloth.dev/i-am-19'
	});
	return json(
		{
			ok: true
		},
		{
			status: 200
		}
	);
}
