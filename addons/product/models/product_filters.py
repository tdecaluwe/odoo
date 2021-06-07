# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, tools, _
from odoo.exceptions import UserError, ValidationError
from odoo.osv import expression


class ProductProperty(models.Model):
    '''
    The product property model is the materialized many2many relation between
    product variants and attribute values. As a consequence they can be used
    as a replacement for the product_variant_combination many2many relation.
    Additionally properties can be defined that apply to all variants in a
    template by omitting the product_product_id field.
    '''
    _name = 'product.property'
    _description = 'Describes an attribute value '

    attribute_id = fields.Many2one('product.attribute', required=True, ondelete='cascade')
    attribute_line_id = fields.Many2one('product.template.attribute.line', required=True, ondelete='cascade')
    attribute_value_id = fields.Many2one('product.attribute.value', required=True, ondelete='cascade')

    product_template_id = fields.Many2one('product.template', required=True, ondelete='cascade')

    product_product_id = fields.Many2one('product.product', ondelete='cascade')
    product_template_attribute_value_id = fields.Many2one('product.template.attribute.value', ondelete='cascade')

    applied_product_ids = fields.Many2many('product.product', relation='product_property_expansion', auto=False)

    numerical_value = fields.Integer()
    affirm = fields.Boolean(default=False)
    negate = fields.Boolean(default=False)

    property_value = fields.Integer(compute='_compute_value', store=True)

    def _compute_value(self):
        for record in self:
            record.property_value = record.attribute_value_id or record.numerical_value

    def init(self):
        super().init()
        self._cr.execute('''
            CREATE OR REPLACE VIEW product_property_expansion AS ( 
            SELECT
                product_product.id AS product_product_id,
                product_property.id AS product_property_id
            FROM product_property
            JOIN product_product
            ON product_property.product_product_id = product_product.id
            OR product_property.product_template_id = product_product.product_tmpl_id
            AND product_property.product_product_id IS NULL)
        ''')

    _sql_constraints = [
        ('variant_attribute_value_fkey', '''
            FOREIGN KEY (product_product_id, product_template_attribute_value_id)
            REFERENCES product_variant_combination (product_product_id, product_template_attribute_value_id)
        ''', 'A product property on the variant level should have a corresponding attribute value entry')
    ]
 
class ProductTemplateAttributeExclusion(models.Model):
    _name = "product.template.attribute.exclusion"
    _description = 'Product Template Attribute Exclusion'
    _order = 'product_tmpl_id, id'

    product_template_attribute_value_id = fields.Many2one(
        'product.template.attribute.value', string="Attribute Value", ondelete='cascade', index=True)
    product_tmpl_id = fields.Many2one(
        'product.template', string='Product Template', ondelete='cascade', required=True, index=True)
    value_ids = fields.Many2many(
        'product.template.attribute.value', relation="product_attr_exclusion_value_ids_rel",
        string='Attribute Values', domain="[('product_tmpl_id', '=', product_tmpl_id), ('ptav_active', '=', True)]")

    matching_product_ids = fields.Many2many('product.product', relation='product_template_attribute_exclusion_match', auto=False)

    def init(self):
        super().init()
        # This view will relate exclusion rules with the variants they match.
        # TODO: Multiple attribute values in the exclusion rule are currently
        #       interpreted as separate exclusion rules. However, they should
        #       ALL match for the exclusion to apply.
        self._cr.execute('''
            CREATE OR REPLACE VIEW product_template_attribute_exclusion_match AS ( 
            SELECT prod.id AS product_product_id, excl.id AS product_template_attribute_exclusion_id
            FROM product_product AS prod
            JOIN product_template AS tmpl
            ON tmpl.id = prod.product_tmpl_id
            JOIN product_property AS prop1
            ON prod.id = prop1.product_product_id
            JOIN product_template_attribute_value AS ptav1
            ON ptav1.id = prop1.product_template_attribute_value_id
            JOIN product_property AS prop2
            ON prod.id = prop2.product_product_id AND prop1.id <> prop2.id
            JOIN product_template_attribute_value AS ptav2
            ON ptav2.id = prop2.product_template_attribute_value_id
            JOIN product_template_attribute_exclusion AS excl
            ON excl.product_template_attribute_value_id = ptav1.id AND excl.product_tmpl_id = tmpl.id
            JOIN product_attr_exclusion_value_ids_rel AS rel
            ON rel.product_template_attribute_exclusion_id = excl.id 
            AND rel.product_template_attribute_value_id = ptav2.id)
        ''')
