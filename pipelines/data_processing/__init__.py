"""
Data processing pipelines for NASA exoplanet data.

This module contains the three-step pipeline:
1. Convert NASA CSV to JSON
2. Create spatial clusters
3. Enrich with characteristics and coordinates
"""

__all__ = [
    'convert_nasa_data',
    'cluster_planets',
    'enrich_characteristics'
]
