const core = require('@actions/core') // Helps with inputs and outputs
const exec = require('@actions/exec') // Helps with executing commands

async function run() {
    try {
        const vercelToken = core.getInput('vercel-token', { required: true })
        const distFolder = core.getInput('dist-folder', { required: true })

        let output = ''
        const options = {
            listeners: {
                stdout: (data) => {
                    output += data.toString()
                }
            }
        }

        // First deployment
        await exec.exec(`npx vercel --prod --yes --token ${vercelToken} --cwd ${distFolder}`, [], options)

        // Extract deploy URL from output
        const match = output.match(/https?:\/\/[^\s]+/g)
        const deployUrl = match ? match[0] : ''
        core.setOutput('deploy-url', deployUrl)
    } catch (error) {
        core.setFailed(error.message)
    }
}

run()
