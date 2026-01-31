"""
NASA Exoplanet Data Processing Pipelines

This package contains the complete data processing pipeline for NASA exoplanet data,
including conversion, clustering, and characteristic enrichment.
"""

__version__ = '1.0.0'
__author__ = 'Hamburg AI Hackathon Team'
__description__ = 'NASA Exoplanet Data Processing Pipelines'

# Pipeline steps
PIPELINE_STEPS = [
    {
        'number': 1,
        'name': 'Convert NASA Data',
        'script': 'data_processing/01_convert_nasa_data.py',
        'description': 'Convert raw NASA CSV to frontend-friendly JSON'
    },
    {
        'number': 2,
        'name': 'Cluster Planets',
        'script': 'data_processing/02_cluster_planets.py',
        'description': 'Create spatial clusters for progressive loading'
    },
    {
        'number': 3,
        'name': 'Enrich Characteristics',
        'script': 'data_processing/03_enrich_characteristics.py',
        'description': 'Add planet characteristics and coordinate systems'
    }
]

def get_pipeline_info():
    """Get information about the pipeline steps."""
    return PIPELINE_STEPS
