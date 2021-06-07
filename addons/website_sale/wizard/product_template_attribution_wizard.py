# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from collections import OrderedDict

from odoo import models, fields, api


class ProductTemplateAttribution(models.TransientModel):
    _name = 'product.template.attribution'
    _description = 'A wizard enabling quick management of attribute values for attribute publications'

    selected_ids = fields.One2many('product.template.attribution.line', inverse_name='wizard_id')
    attribute_id = fields.Many2one('product.attribute', required=True)
    multi_valued = fields.Boolean(related='attribute_id.multi_valued')

class ProductTemplateAttributionLine(models.TransientModel):
    _name = 'product.template.attribution.line'
    _description = 'A line in the attribution wizard, managing the attribute values for the related product'

    _inherits = {'product.template': 'product_template_id'}

    wizard_id = fields.Many2one('product.template.attribution', required=True)

    product_template_id = fields.Many2one('product.template', required=True)
    attribute_id = fields.Many2one(related='wizard_id.attribute_id')
    multi_valued = fields.Boolean(related='wizard_id.attribute_id.multi_valued')

    attribute_value_id = fields.Many2one('product.attribute.value',
        string = 'Attribute Value',
        domain='[("attribute_id", "=", attribute_id)]',
        compute='_get_values', inverse='_set_value', compute_sudo=False,
        store=True, group_expand='_attribute_value_groups')
    attribute_value_ids = fields.Many2many('product.attribute.value',
        string = 'Attribute Values',
        domain='[("attribute_id", "=", attribute_id)]',
        compute='_get_values', inverse='_set_values', compute_sudo=False)

    @api.depends('attribute_line_ids', 'attribute_id')
    def _get_values(self):
        for record in self:
            attribute_line_id = record.attribute_line_ids.filtered(
                lambda line: line.attribute_id == record.attribute_id
            )

            if attribute_line_id:
                record.attribute_value_ids = attribute_line_id.value_ids

            if attribute_line_id and not record.multi_valued:
                record.attribute_value_id = attribute_line_id.value_ids
    
    def _set_values(self):
        self.ensure_one()

        attribute_line_id = self.attribute_line_ids.filtered(
            lambda line: line.attribute_id == self.attribute_id
        )

        if not attribute_line_id:
            self.env['product.template.attribute.line'].create({
                'product_tmpl_id': self.product_template_id.id,
                'attribute_id': self.attribute_id.id,
                'value_ids': [(6, 0, self.attribute_value_ids.ids)],
            })
        else:
            attribute_line_id.value_ids = self.attribute_value_ids

    def _set_value(self):
        self.ensure_one()

        self.attribute_value_ids = self.attribute_value_id
        self._set_values()

    @api.model
    def _attribute_value_groups(self, active_ids, domain, order):
        if domain[0] and domain[0][2]:
            wizard = self.env['product.template.attribution'].browse(domain[0][2])
            return wizard.attribute_id.value_ids

        return active_ids