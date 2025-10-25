#!/usr/bin/env python3
"""
Apply default theme to analytics dashboard
"""

import re

# Read the file
with open('client/src/pages/analytics-dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Define replacements (old_pattern -> new_value)
replacements = [
    # Background colors
    (r'bg-\[#1e293b\]', 'bg-background'),
    (r'bg-\[#1e3a52\]', 'bg-card'),
    (r'bg-\[#1e3d2f\]', 'bg-card'),
    (r'bg-\[#2d2416\]', 'bg-card'),
    (r'bg-\[#1a3840\]', 'bg-card'),
    (r'bg-\[#3a1e40\]', 'bg-card'),
    (r'bg-\[#3d1e1e\]', 'bg-card'),
    (r'bg-slate-800/90', 'bg-card'),
    (r'bg-slate-900/50', 'bg-card'),
    (r'bg-slate-700/50', 'bg-card/50'),
    (r'bg-slate-700', 'bg-muted'),
    
    # Border colors
    (r'border-slate-700/50', 'border-0'),
    (r'border-slate-700/30', 'border-border'),
    (r'border-slate-700/20', 'border-border'),
    (r'border-slate-700/10', 'border-border'),
    (r'border-purple-200/50', 'border-0'),
    (r'border-purple-800/50', 'border-0'),
    (r'border-blue-200/50', 'border-0'),
    (r'border-green-200/50', 'border-0'),
    (r'border-2 border-purple-200/30', 'border-0'),
    (r'border-2 border-red-200/30', 'border-0'),
    
    # Text colors
    (r'text-slate-400', 'text-muted-foreground'),
    (r'text-slate-300', 'text-muted-foreground'),
    (r'text-slate-200', 'text-card-foreground'),
    (r'text-white(?!\/)', 'text-card-foreground'),
    (r'text-purple-400', 'text-primary'),
    (r'text-blue-400', 'text-primary'),
    (r'text-green-400', 'text-primary'),
    (r'text-cyan-400', 'text-primary'),
    (r'text-pink-400', 'text-primary'),
    (r'text-orange-400', 'text-primary'),
    (r'text-red-400', 'text-destructive'),
    
    # Colored backgrounds for icons
    (r'bg-purple-500/20', 'bg-primary/10'),
    (r'bg-blue-500/20', 'bg-primary/10'),
    (r'bg-green-500/20', 'bg-primary/10'),
    (r'bg-cyan-500/20', 'bg-primary/10'),
    (r'bg-pink-500/20', 'bg-primary/10'),
    (r'bg-orange-500/20', 'bg-primary/10'),
    (r'bg-red-500/20', 'bg-destructive/10'),
    
    # Badge colors
    (r'bg-purple-500/20 text-purple-300', 'bg-primary/10 text-primary'),
    (r'bg-blue-500/20 text-blue-300', 'bg-primary/10 text-primary'),
    (r'bg-green-500/20 text-green-300', 'bg-primary/10 text-primary'),
    (r'bg-cyan-500/20 text-cyan-300', 'bg-primary/10 text-primary'),
    (r'bg-pink-500/20 text-pink-300', 'bg-primary/10 text-primary'),
    (r'bg-orange-500/20 text-orange-300', 'bg-primary/10 text-primary'),
    (r'bg-red-500/20 text-red-300', 'bg-destructive/10 text-destructive'),
    
    # Hover effects
    (r'hover:shadow-2xl', 'hover:bg-accent/50'),
    (r'hover:bg-red-50/50', 'hover:bg-accent/50'),
    (r'hover:bg-orange-50/50', 'hover:bg-accent/50'),
    (r'hover:bg-cyan-50/50', 'hover:bg-accent/50'),
    (r'hover:bg-slate-700/20', 'hover:bg-accent/50'),
    
    # Gradient orbs - remove colored gradients
    (r'bg-gradient-to-br from-purple-500/10 to-transparent', 'bg-primary/5'),
    (r'bg-gradient-to-br from-blue-500/10 to-transparent', 'bg-primary/5'),
    (r'bg-gradient-to-br from-green-500/10 to-transparent', 'bg-primary/5'),
    (r'bg-gradient-to-br from-cyan-500/10 to-transparent', 'bg-primary/5'),
    (r'bg-gradient-to-br from-pink-500/10 to-transparent', 'bg-primary/5'),
    (r'bg-gradient-to-br from-orange-500/10 to-transparent', 'bg-primary/5'),
    (r'bg-gradient-to-br from-red-500/10 to-transparent', 'bg-destructive/5'),
    
    # Chart card icon backgrounds
    (r'bg-gradient-to-br from-purple-500 to-purple-600', 'bg-gradient-to-br from-primary/80 to-primary'),
    (r'bg-gradient-to-br from-blue-500 to-blue-600', 'bg-gradient-to-br from-primary/80 to-primary'),
    (r'bg-gradient-to-br from-green-500 to-green-600', 'bg-gradient-to-br from-primary/80 to-primary'),
    (r'bg-gradient-to-br from-pink-500 to-pink-600', 'bg-gradient-to-br from-primary/80 to-primary'),
    
    # Icon text colors in gradients
    (r'text-white(?="\s*/>)', 'text-primary-foreground'),
]

# Apply all replacements
for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Write back
with open('client/src/pages/analytics-dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Theme applied successfully!")
print(f"Applied {len(replacements)} replacement patterns")
