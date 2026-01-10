/**
 * @fileoverview Module loader for SynthBlockly Stage.
 * Handles dynamic loading of block definitions and generators.
 */

export async function loadModule(url, suppressError = false) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch module from ${url}: ${response.statusText}`);
        }
        const script = document.createElement('script');
        script.src = url;
        
        return new Promise((resolve, reject) => {
            script.onload = () => resolve(true);
            script.onerror = () => {
                if (suppressError) resolve(false);
                else reject(new Error(`Failed to load script: ${url}`));
            };
            document.head.appendChild(script);
        });
    } catch (e) {
        if (!suppressError) console.error('Error loading module:', url, e);
        return false;
    }
}

/**
 * Loads all modules defined in a manifest JSON file sequentially.
 * @param {string} manifestUrl URL to the manifest.json file.
 */
export async function loadModules(manifestUrl) {
    try {
        const response = await fetch(manifestUrl);
        const manifest = await response.json();
        
        const baseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf('/') + 1);
        
        // Load modules one by one to ensure correct initialization order
        for (const module of manifest.modules) {
            await loadModule(baseUrl + module.url);
        }

        console.log('All modules loaded successfully.');
    } catch (e) {
        console.error('Failed to load modules from manifest:', e);
    }
}
