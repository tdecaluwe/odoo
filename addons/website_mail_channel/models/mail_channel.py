# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from werkzeug import urls

from odoo import models, tools
from odoo.addons.http_routing.models.ir_http import slug


class MailGroup(models.Model):
    _inherit = 'mail.channel'

    def _notify_email_header_dict(self):
        headers = super(MailGroup, self)._notify_email_header_dict()
        base_url = self.get_base_url()
        headers['List-Archive'] = '<%s/groups/%s>' % (base_url, slug(self))
        headers['List-Subscribe'] = '<%s/groups>' % (base_url)
        headers['List-Unsubscribe'] = '<%s/groups?unsubscribe>' % (base_url,)
        return headers

    def _send_confirmation_email(self, partner_ids, unsubscribe=False):
        website = self.env['website'].get_current_website()
        base_url = website.get_base_url()

        route = "/groups/%(action)s/%(channel)s/%(partner)s/%(token)s"
        if unsubscribe:
            template = self.env.ref('website_mail_channel.mail_template_list_unsubscribe')
            action = 'unsubscribe'
        else:
            template = self.env.ref('website_mail_channel.mail_template_list_subscribe')
            action = 'subscribe'

        for partner_id in partner_ids:
            # generate a new token per subscriber
            token = self._generate_action_token(partner_id, action=action)

            token_url = urls.url_join(base_url, route % {
                'action': action,
                'channel': self.id,
                'partner': partner_id,
                'token': token,
            })
            template.with_context(token_url=token_url).send_mail(
                self.id,
                force_send=True,
                email_values={
                    'recipient_ids': [(4, partner_id)],
                    'email_from': website.company_id.email_formatted,
                    'author_id': self.create_uid.partner_id.id,
                    'message_type': 'user_notification',
                },
                notif_layout='mail.mail_notification_light',
            )

        return True

    def _generate_action_token(self, partner_id, action='unsubscribe'):
        self.ensure_one()
        data = '$'.join([
                str(self.id),
                str(partner_id),
                action])
        return tools.hmac(self.env(su=True), 'website_mail_channel-email-subscription', data)
