import { ApplyOptions, RequiresClientPermissions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { EmbedBuilder, PermissionFlagsBits, type ColorResolvable } from 'discord.js';
import { fetch, FetchResultTypes, FetchMethods } from '@sapphire/fetch';
// import { pickRandom } from '../lib/utils';
// import { RandomLoadingMessage } from '../lib/constants';

//Create an enum type for the status of the server
//* 0 - Stopped * 1 - Starting * 2 - Running * 3 - Crashed
enum ServerStatus {
	Stopped = 0,
	Starting = 1,
	Running = 2,
	Crashed = 3
}

interface JsonPlaceholderStatusResponse {
	simSpeed: number;
	memberCount: number;
	uptime: string;
	status: ServerStatus;
}

@ApplyOptions<Subcommand.Options>({
	aliases: ['server'],
	description: 'Server actions',
	subcommands: [
		{
			name: 'status',
			chatInputRun: 'chatInputStatus',
			default: true
		},
		{
			name: 'action',
			chatInputRun: 'chatInputAction'
		}
	]
})
export class UserCommand extends Subcommand {
	registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(
			(builder) =>
				builder
					.setName('server')
					.setDescription('SE Commands') // Needed even though base command isn't displayed to end user
					.addSubcommand((command) => command.setName('status').setDescription('Show SE Status'))
					.addSubcommand((command) =>
						command
							.setName('action')
							.setDescription('Change the running state of the server')
							.addStringOption((option) => option.setName('action').setDescription('action to preform').setRequired(true))
					)
		);
	}

	@RequiresClientPermissions([PermissionFlagsBits.EmbedLinks])
	public async chatInputStatus(interaction: Subcommand.ChatInputCommandInteraction) {
		let reply = interaction.deferReply({ ephemeral: true });
		// const loadingMessage = await (await reply).edit({ embeds: [new EmbedBuilder().setDescription(pickRandom(RandomLoadingMessage)).setColor('#FF0000')] });
		try {
			const data = await fetch<JsonPlaceholderStatusResponse>(
				`${process.env.SE_API_ENDPOINT}/api/v1/server/status`,
				{
					method: FetchMethods.Post,
					headers: {
						// Bearer auth
						Authorization: `Bearer ${process.env.BEARER_TOKEN}`
					}
				},
				FetchResultTypes.JSON
			);
			let color: ColorResolvable;
			let status: string;
			switch (data.status) {
				case ServerStatus.Stopped:
					status = 'Stopped';
					color = '#000000'; //black in hex
					break;
				case ServerStatus.Starting:
					status = 'Starting';
					color = '#F3E300'; //bright yellow in hex
					break;
				case ServerStatus.Running:
					status = 'Running';
					color = '#0CF300'; //bright green in hex
					break;
				case ServerStatus.Crashed:
					status = 'Crashed';
					color = '#F30000'; //bright red in hex
					break;
			}
			const embed = new EmbedBuilder()
				.setColor(color)
				.setTitle('Server Status')
				.setDescription('The server is currently online')
				.addFields(
					{ name: 'Server Status', value: status, inline: false },
					{ name: 'Server Uptime', value: data.uptime, inline: true },
					{ name: 'Members Online', value: data.memberCount.toString(), inline: true },
					{ name: 'Sim Speed', value: data.simSpeed.toString(), inline: true }
				)
				.setTimestamp();
			return (await reply).edit({ embeds: [embed] });
		} catch (error) {
			console.error(error);
			return (await reply).edit({ content: '🚨 Server not responding, action failed 🚨' });
		}
	}

	@RequiresClientPermissions([PermissionFlagsBits.EmbedLinks])
	public async chatInputAction(interaction: Subcommand.ChatInputCommandInteraction) {
		let reply = interaction.deferReply({ ephemeral: true });
		// const loadingMessage = await (await reply).edit({ embeds: [new EmbedBuilder().setDescription(pickRandom(RandomLoadingMessage)).setColor('#FF0000')] });
		try {
			const data = await fetch(`${process.env.SE_API_ENDPOINT}/api/v1/server/${interaction.command?.options}`, {
				method: FetchMethods.Post,
				headers: {
					// Bearer auth
					Authorization: `Bearer ${process.env.BEARER_TOKEN}`
				}
			});
			console.log(data);
			const embed = new EmbedBuilder()
				.setColor('#F30000')
				.setTitle(`Server ${interaction.command?.options}ed`)
				.setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL() || undefined })
				.setTimestamp();
			return (await reply).edit({ embeds: [embed] });
		} catch (error) {
			console.error(error);
			return (await reply).edit({ content: '🚨 Server not responding, action failed 🚨' });
		}
	}
}
