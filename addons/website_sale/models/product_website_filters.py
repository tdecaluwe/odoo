# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from collections import OrderedDict

from odoo import models, fields, api


class ProductTemplateAttribute(models.Model):
    _inherit = 'product.attribute'

    product_attribute_publication_ids = fields.One2many('product.attribute.publication', inverse_name='product_attribute_id')

class ProductTemplateAttributeValue(models.Model):
    _inherit = 'product.attribute.value'

class ProductAttributePublication(models.Model):
    _name = 'product.attribute.publication'
    _description = 'Publish an attribute in a website category'

    product_attribute_id = fields.Many2one('product.attribute', required=True)
    product_public_category_id = fields.Many2one('product.public.category', required=True)
    multi_valued = fields.Boolean(related='product_attribute_id.multi_valued')
    create_variant = fields.Selection(related='product_attribute_id.create_variant')

    product_template_ids = fields.Many2many('product.template', related='product_public_category_id.product_tmpl_ids')

    total_count = fields.Integer(compute='_compute_product_count')
    valid_count = fields.Integer(compute='_compute_product_count')

    _sql_constraints = [(
        'unique_attribute_and_category',
        'UNIQUE (product_attribute_id, product_public_category_id)',
        'Cannot insert an attribute publication for the same category'
    )]

    @api.depends('product_attribute_id', 'product_public_category_id')
    def _compute_product_count(self):
        for record in self:
            record.total_count = len(record.product_template_ids)
            record.valid_count = len(record.product_template_ids.filtered_domain([
                ('attribute_line_ids.attribute_id', '=', record.product_attribute_id.id),
            ])) if record.product_attribute_id else record.total_count

    def bubble_up(self):
        self.ensure_one()

        parent_id = self.product_public_category_id.parent_id

        publication_ids = self.env['product.attribute.publication'].search([
            ('product_attribute_id', '=', self.product_attribute_id.id),
            ('product_public_category_id', 'in', parent_id.child_id.ids)
        ])
        
        if len(publication_ids) == len(parent_id.child_id):
            self.create({
                'product_attribute_id': self.product_attribute_id.id,
                'product_public_category_id': parent_id.id,
            })
            publication_ids.unlink()

    def push_down(self):
        self.ensure_one()

        attribute = self.product_attribute_id
        children = self.product_public_category_id.child_id

        self.create([{
            'product_attribute_id': attribute.id,
            'product_public_category_id': child.id,
        } for child in children])

        self.unlink()

    def view_products(self):
        self.ensure_one()

        ref = not self.multi_valued and 'website_sale.product_template_attribution_single_valued_view_tree'
        ref = self.multi_valued and 'website_sale.product_template_attribution_multi_valued_view_tree' or ref
        
        views = [(self.env.ref(ref).id, 'tree')]
        product_wizard = self.env['product.template.attribution'].create({
            'attribute_id': self.product_attribute_id.id,
        })
        product_selection = self.env['product.template.attribution.line'].create([{
            'wizard_id': product_wizard.id,
            'product_template_id': record.id,            
        } for record in self.product_template_ids])

        if not self.multi_valued:
            views = [(False, 'kanban')] + views

        return {
            'name': 'Products',
            'type': 'ir.actions.act_window',
            'res_model': 'product.template.attribution.line',
            'views': views,
            'domain': [('wizard_id', '=', product_wizard.id)],
            'target': 'current'
        }
