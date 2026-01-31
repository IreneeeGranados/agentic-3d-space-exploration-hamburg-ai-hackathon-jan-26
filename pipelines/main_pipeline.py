"""
NASA Exoplanet Data Processing Pipeline
Main orchestrator script for the complete data pipeline
"""

import os
import sys
import subprocess
from datetime import datetime

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(PROJECT_ROOT, '..'))

class PipelineOrchestrator:
    """Orchestrates the complete NASA data processing pipeline."""
    
    def __init__(self, data_dir='../nasa_data'):
        self.data_dir = data_dir
        self.processing_dir = os.path.join(PROJECT_ROOT, 'data_processing')
        self.logs = []
        
    def log(self, message):
        """Log a message with timestamp."""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f"[{timestamp}] {message}"
        print(log_entry)
        self.logs.append(log_entry)
        
    def run_step(self, step_name, script_path, description):
        """Run a pipeline step."""
        self.log(f"{'='*70}")
        self.log(f"STEP: {step_name}")
        self.log(f"Description: {description}")
        self.log(f"Script: {script_path}")
        self.log(f"{'='*70}")
        
        try:
            result = subprocess.run(
                ['python3', script_path],
                cwd=os.path.join(PROJECT_ROOT, '..'),
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                self.log(f"✅ {step_name} completed successfully")
                if result.stdout:
                    print(result.stdout)
                return True
            else:
                self.log(f"❌ {step_name} failed")
                if result.stderr:
                    print("Error output:")
                    print(result.stderr)
                return False
                
        except Exception as e:
            self.log(f"❌ {step_name} failed with exception: {str(e)}")
            return False
    
    def run_full_pipeline(self):
        """Run the complete data pipeline from start to finish."""
        self.log("🚀 Starting NASA Exoplanet Data Pipeline")
        self.log(f"Working directory: {self.data_dir}")
        
        steps = [
            {
                'name': 'Step 0: Download NASA Data',
                'script': 'pipelines/data_processing/00_download_nasa_data.py',
                'description': 'Download latest exoplanet data from NASA Exoplanet Archive'
            },
            {
                'name': 'Step 1: Convert NASA Data',
                'script': 'pipelines/data_processing/01_convert_nasa_data.py',
                'description': 'Convert raw NASA CSV to frontend-friendly JSON format'
            },
            {
                'name': 'Step 2: Cluster Planets',
                'script': 'pipelines/data_processing/02_cluster_planets.py',
                'description': 'Create spatial clusters for progressive loading'
            },
            {
                'name': 'Step 3: Enrich Characteristics',
                'script': 'pipelines/data_processing/03_enrich_characteristics.py',
                'description': 'Add planet characteristics and coordinate systems'
            }
        ]
        
        success_count = 0
        
        for step in steps:
            if self.run_step(step['name'], step['script'], step['description']):
                success_count += 1
            else:
                self.log(f"⚠️  Pipeline stopped at {step['name']}")
                break
        
        self.log(f"\n{'='*70}")
        self.log(f"📊 Pipeline Summary")
        self.log(f"{'='*70}")
        self.log(f"Steps completed: {success_count}/{len(steps)}")
        
        if success_count == len(steps):
            self.log("✅ Full pipeline completed successfully!")
            self.log("\n📁 Output files:")
            self.log(f"   • nasa_data/nasa_exoplanets_frontend.json")
            self.log(f"   • nasa_data/clusters/*.json (17 cluster files)")
            self.log(f"   • nasa_data/clusters/cluster_index.json")
            return True
        else:
            self.log("❌ Pipeline failed")
            return False
    
    def run_single_step(self, step_number):
        """Run a single pipeline step by number (0-3)."""
        steps = {
            0: {
                'name': 'Download NASA Data',
                'script': 'pipelines/data_processing/00_download_nasa_data.py',
                'description': 'Download latest exoplanet data from NASA Exoplanet Archive'
            },
            1: {
                'name': 'Convert NASA Data',
                'script': 'pipelines/data_processing/01_convert_nasa_data.py',
                'description': 'Convert raw NASA CSV to frontend-friendly JSON format'
            },
            2: {
                'name': 'Cluster Planets',
                'script': 'pipelines/data_processing/02_cluster_planets.py',
                'description': 'Create spatial clusters for progressive loading'
            },
            3: {
                'name': 'Enrich Characteristics',
                'script': 'pipelines/data_processing/03_enrich_characteristics.py',
                'description': 'Add planet characteristics and coordinate systems'
            }
        }
        
        if step_number not in steps:
            self.log(f"❌ Invalid step number: {step_number}")
            self.log(f"Valid steps: 0, 1, 2, 3")
            return False
        
        step = steps[step_number]
        return self.run_step(f"Step {step_number}: {step['name']}", 
                           step['script'], 
                           step['description'])


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='NASA Exoplanet Data Processing Pipeline',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run full pipeline
  python main_pipeline.py --full
  
  # Run single step
  python main_pipeline.py --step 0  # Download data
  python main_pipeline.py --step 1  # Convert data
  python main_pipeline.py --step 2  # Cluster planets
  python main_pipeline.py --step 3  # Enrich data
  
  # Show pipeline info
  python main_pipeline.py --info
        """
    )
    
    parser.add_argument('--full', action='store_true', 
                       help='Run the complete pipeline')
    parser.add_argument('--step', type=int, choices=[0, 1, 2, 3],
                       help='Run a specific step (0-3)')
    parser.add_argument('--info', action='store_true',
                       help='Show pipeline information')
    parser.add_argument('--data-dir', default='../nasa_data',
                       help='Path to NASA data directory (default: ../nasa_data)')
    
    args = parser.parse_args()
    
    if args.info:
        print("""
╔══════════════════════════════════════════════════════════════════════╗
║          NASA Exoplanet Data Processing Pipeline                    ║
╚══════════════════════════════════════════════════════════════════════╝

📋 Pipeline Steps:

0️⃣  Download NASA Data (00_download_nasa_data.py)
   • Source: NASA Exoplanet Archive API
   • Outputs: nasa_data/nasa_data.csv
   • Purpose: Download latest exoplanet data from NASA
   • Duration: ~30-60 seconds

1️⃣  Convert NASA Data (01_convert_nasa_data.py)
   • Reads: nasa_data/nasa_data.csv
   • Outputs: nasa_data/nasa_exoplanets_frontend.json
   • Purpose: Convert NASA CSV format to clean JSON
   • Duration: ~1-2 minutes

2️⃣  Cluster Planets (02_cluster_planets.py)
   • Reads: nasa_data/nasa_exoplanets_frontend.json
   • Outputs: nasa_data/clusters/*.json (17 files)
   • Purpose: Create spatial clusters for progressive loading
   • Duration: ~1-2 minutes

3️⃣  Enrich Characteristics (03_enrich_characteristics.py)
   • Reads: nasa_data/clusters/*.json
   • Outputs: Updated cluster files with enriched data
   • Purpose: Add planet characteristics and coordinate systems
   • Duration: ~1-2 minutes

📊 Total Pipeline Time: ~4-7 minutes
📁 Total Planets Processed: Latest from NASA

🎯 Output Features:
   • Planet characteristics (habitability, toxicity, etc.)
   • Dual coordinate systems (Cartesian + ICRS)
   • Spatial clustering for performance
   • Progressive loading support
        """)
        return
    
    pipeline = PipelineOrchestrator(args.data_dir)
    
    if args.full:
        success = pipeline.run_full_pipeline()
        sys.exit(0 if success else 1)
    elif args.step:
        success = pipeline.run_single_step(args.step)
        sys.exit(0 if success else 1)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
