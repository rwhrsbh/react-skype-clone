
import ngrok from 'ngrok';
import { exec } from 'child_process';

(async function() {
    try {
        console.log('Starting ngrok tunnel for port 8080...');
        const url = await ngrok.connect({ addr: 8080 });

        console.log('-------------------------------------------------');
        console.log('Ngrok tunnel established!');
        console.log(`Your application is available at: ${url}`);
        console.log('Share this URL with your friends.');
        console.log('-------------------------------------------------');

        // Start the production server
        const proc = exec('node server.js');
        proc.stderr.pipe(process.stderr);
        proc.stdout.pipe(process.stdout);

    } catch (error) {
        console.error('Error starting ngrok or server:', error);
        process.exit(1);
    }
})();
