from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.views import View
from .models import Tenant, TenantBrandingPreset
import json


@staff_member_required
@require_http_methods(["GET"])
def tenant_branding_css(request, tenant_id):
    """Generate CSS file for a specific tenant's branding"""
    tenant = get_object_or_404(Tenant, id=tenant_id)
    
    css_content = tenant.get_branding_css()
    
    response = HttpResponse(css_content, content_type='text/css')
    response['Content-Disposition'] = f'inline; filename="tenant-{tenant.schema_name}-branding.css"'
    return response


@staff_member_required
@require_http_methods(["GET"])
def tenant_branding_json(request, tenant_id):
    """Get tenant branding configuration as JSON"""
    tenant = get_object_or_404(Tenant, id=tenant_id)
    
    branding_data = {
        'tenant_id': tenant.id,
        'tenant_name': tenant.name,
        'schema_name': tenant.schema_name,
        'branding': {
            'logo_url': tenant.logo_url,
            'favicon_url': tenant.favicon_url,
            'primary_color': tenant.primary_color,
            'secondary_color': tenant.secondary_color,
            'accent_color': tenant.accent_color,
            'background_color': tenant.background_color,
            'text_color': tenant.text_color,
            'font_family': tenant.font_family,
            'sidebar_style': tenant.sidebar_style,
            'custom_css': tenant.custom_css,
        },
        'css_variables': {
            '--tenant-primary-color': tenant.primary_color,
            '--tenant-secondary-color': tenant.secondary_color,
            '--tenant-accent-color': tenant.accent_color,
            '--tenant-background-color': tenant.background_color,
            '--tenant-text-color': tenant.text_color,
            '--tenant-font-family': tenant.font_family,
        }
    }
    
    return JsonResponse(branding_data)


@method_decorator(staff_member_required, name='dispatch')
class ApplyPresetView(View):
    """Apply a branding preset to a tenant"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            preset_id = data.get('preset_id')
            tenant_id = data.get('tenant_id')
            
            if not preset_id or not tenant_id:
                return JsonResponse({
                    'success': False,
                    'error': 'Both preset_id and tenant_id are required'
                }, status=400)
            
            preset = get_object_or_404(TenantBrandingPreset, id=preset_id, is_active=True)
            tenant = get_object_or_404(Tenant, id=tenant_id)
            
            # Apply preset to tenant
            preset.apply_to_tenant(tenant)
            
            return JsonResponse({
                'success': True,
                'message': f'Applied "{preset.name}" preset to {tenant.name}',
                'tenant_branding': {
                    'primary_color': tenant.primary_color,
                    'secondary_color': tenant.secondary_color,
                    'accent_color': tenant.accent_color,
                    'background_color': tenant.background_color,
                    'text_color': tenant.text_color,
                    'font_family': tenant.font_family,
                    'sidebar_style': tenant.sidebar_style,
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


@staff_member_required
@require_http_methods(["GET"])
def branding_presets_list(request):
    """Get list of available branding presets"""
    presets = TenantBrandingPreset.objects.filter(is_active=True).order_by('name')
    
    presets_data = []
    for preset in presets:
        presets_data.append({
            'id': preset.id,
            'name': preset.name,
            'description': preset.description,
            'colors': {
                'primary': preset.primary_color,
                'secondary': preset.secondary_color,
                'accent': preset.accent_color,
                'background': preset.background_color,
                'text': preset.text_color,
            },
            'font_family': preset.font_family,
            'sidebar_style': preset.sidebar_style,
        })
    
    return JsonResponse({
        'presets': presets_data,
        'total_count': len(presets_data)
    })


@staff_member_required
@require_http_methods(["GET"])
def tenant_branding_preview(request, tenant_id):
    """Generate HTML preview of tenant branding"""
    tenant = get_object_or_404(Tenant, id=tenant_id)
    
    preview_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{tenant.name} - Branding Preview</title>
        <style>
            {tenant.get_branding_css()}
            
            body {{
                margin: 0;
                padding: 20px;
                background-color: {tenant.background_color};
                color: {tenant.text_color};
                font-family: {tenant.font_family};
            }}
            
            .preview-container {{
                max-width: 800px;
                margin: 0 auto;
            }}
            
            .header {{
                background-color: {tenant.primary_color};
                color: white;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }}
            
            .logo {{
                max-height: 50px;
            }}
            
            .card {{
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }}
            
            .btn {{
                padding: 10px 20px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                margin-right: 10px;
                font-family: {tenant.font_family};
                font-weight: 500;
            }}
            
            .btn-primary {{
                background-color: {tenant.primary_color};
                color: white;
            }}
            
            .btn-secondary {{
                background-color: {tenant.secondary_color};
                color: white;
            }}
            
            .btn-accent {{
                background-color: {tenant.accent_color};
                color: white;
            }}
            
            .sidebar-preview {{
                width: 200px;
                height: 300px;
                background-color: {'var(--tenant-primary-color)' if tenant.sidebar_style == 'branded' else '#f8f9fa' if tenant.sidebar_style == 'light' else '#374151'};
                color: {'white' if tenant.sidebar_style in ['branded', 'dark'] else '#374151'};
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
            }}
        </style>
    </head>
    <body class="tenant-branded">
        <div class="preview-container">
            <div class="header">
                <div>
                    {f'<img src="{tenant.logo_url}" alt="Logo" class="logo">' if tenant.logo_url else ''}
                    <h1 style="margin: 0;">{tenant.name}</h1>
                </div>
                <div>Branding Preview</div>
            </div>
            
            <div class="card">
                <h2 style="color: {tenant.primary_color};">Welcome to {tenant.name}</h2>
                <p>This preview shows how your medical platform will look with the current branding configuration.</p>
                
                <div style="margin: 20px 0;">
                    <button class="btn btn-primary">Schedule Appointment</button>
                    <button class="btn btn-secondary">View Records</button>
                    <button class="btn btn-accent">Contact Us</button>
                </div>
            </div>
            
            <div class="card">
                <h3>Sidebar Preview ({tenant.get_sidebar_style_display()})</h3>
                <div class="sidebar-preview">
                    <h4 style="margin-top: 0;">Navigation</h4>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 8px 0;">Dashboard</li>
                        <li style="padding: 8px 0;">Patients</li>
                        <li style="padding: 8px 0;">Appointments</li>
                        <li style="padding: 8px 0;">Treatments</li>
                        <li style="padding: 8px 0;">Settings</li>
                    </ul>
                </div>
            </div>
            
            <div class="card">
                <h3>Color Palette</h3>
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <div style="text-align: center;">
                        <div style="width: 60px; height: 60px; background-color: {tenant.primary_color}; border-radius: 8px; margin-bottom: 8px;"></div>
                        <small>Primary<br>{tenant.primary_color}</small>
                    </div>
                    <div style="text-align: center;">
                        <div style="width: 60px; height: 60px; background-color: {tenant.secondary_color}; border-radius: 8px; margin-bottom: 8px;"></div>
                        <small>Secondary<br>{tenant.secondary_color}</small>
                    </div>
                    <div style="text-align: center;">
                        <div style="width: 60px; height: 60px; background-color: {tenant.accent_color}; border-radius: 8px; margin-bottom: 8px;"></div>
                        <small>Accent<br>{tenant.accent_color}</small>
                    </div>
                    <div style="text-align: center;">
                        <div style="width: 60px; height: 60px; background-color: {tenant.background_color}; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 8px;"></div>
                        <small>Background<br>{tenant.background_color}</small>
                    </div>
                    <div style="text-align: center;">
                        <div style="width: 60px; height: 60px; background-color: {tenant.text_color}; border-radius: 8px; margin-bottom: 8px;"></div>
                        <small>Text<br>{tenant.text_color}</small>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>Typography</h3>
                <p style="font-family: {tenant.font_family}; margin: 0;">
                    Font Family: {tenant.font_family}<br>
                    This is how your text will appear throughout the platform.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return HttpResponse(preview_html, content_type='text/html')