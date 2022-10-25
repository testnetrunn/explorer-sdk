

(async () => {
    // Import dependencies.
    const path = require('path')
    const fs = require('fs')


    // Create a path representing `cosmos_chains` folder's.
    const cosmos_chains_folder_path = 'cosmos_chains'

    // Create a path representing `cosmos_chains` folder's.
    const chain_infos_ts_file_path = 'src/cosmos/chain-infos.ts'

    // Define the new content which will be written to "chain-infos.ts" file.
    let new_chain_infos_ts_content = `import { ChainInfo } from './types/globals'`

    // Declare an array to hold all the chain names.
    const chain_names = []


    // Get all the file names inside `cosmos_chains_folder_path`.
    fs.readdir(cosmos_chains_folder_path, (error, file_names) => {
        // Handle errors.
        if (error) {
            console.error('Unable to generate chain informations!\n', error)
            return
        }

        // Don't include example file.
        file_names = file_names.filter(name => name !== 'example.yaml')


        // Do below for each file name.
        for (const file_name of file_names) {
            // Build the path for the file.
            let file_path = `${cosmos_chains_folder_path}/${file_name}`

            // Try to read the file content.
            fs.readFile(file_path, 'utf-8', (error, content) => {
                // Handle errors.
                if (error) {
                    console.error(`Unable to read '${file_name}'!\n`, error)
                    return
                }

                const chain = parse_yaml(content)

                if (!chain) {
                    console.log(`There is a mistake inside ${file_name}!`)
                    return
                }

                chain_names.push(chain.name)

                new_chain_infos_ts_content += generateTsObject(chain)


            })
        }

        // Wait for file system operations to finish.
        setTimeout(() => {
            // Write the new content to "chain-infos.ts".
            fs.writeFile(chain_infos_ts_file_path, new_chain_infos_ts_content, (error) => {
                // Handle errors.
                if (error) {
                    console.log(`Unable to save chains to 'chain-infos.ts'!\n`, error)
                    return
                }
            })

            // Print all the chain names.
            console.log('Chains:')
            chain_names.forEach(name => console.log(`    ${name}`))

            // Print success message.
            console.log(`\nSuccessfully written to 'chain-infos.ts'!`)

        }, 1000)



    })

})()


/**
 * The function for parsing chain informations in yaml files. \
 * It can return `undefined`, if there is a missing property. \
 * Returns a chain object, if everything is OK.
 */
const parse_yaml = (content) => {
    // Create a chain.
    const chain = {
        name: '',
        rpc: '',
        rest: '',
        socket: '',
        decimals: undefined,
        prefix: '',
        valoperPrefix: undefined,
        consPrefix: undefined,
    }

    // Split lines.
    const lines = content.split('\n')

    // Do below for each line.
    lines.forEach(line => {
        // Remove leading spaces.
        line = line.trim()

        // Do below if the line isn't for a comment.
        if (!line.startsWith('#')) {
            let [key, value] = line.split(': ')

            // Check if both `key` and `value` exists.
            if (key && value) {
                if (key === 'decimals') {
                    // Parse `decimals` as a number.
                    value = parseInt(value)
                }

                chain[key] = value
            }
        }
    })

    chain.objectName = chain.name.split(' ').map(part => capitalize(part)).join('') + 'Info'

    // Check the necessary properties.
    if (chain.name && chain.rpc && chain.rest && chain.socket && chain.objectName && chain.prefix) {
        return {
            objectName: chain.objectName,
            name: chain.name,
            rpc: chain.rpc,
            rest: chain.rest,
            socket: chain.socket,
            decimals: chain.decimals ?? 6, // If `decimals` is not given, suppose it is 6.
            prefix: chain.prefix,
            // If prefixes below are not given, create them using the prefix above.
            valoperPrefix: chain.valoperPrefix ?? chain.prefix + 'valoper',
            consPrefix: chain.consPrefix ?? chain.prefix + 'valcon',
        }
    }
}

/**
 * Capitalizes the first letter of given text.
 */
const capitalize = text => {
    return text.replace(/^\w/, c => c.toUpperCase())
}

/** 
 * Generates a TypeScript object using given `chain`.
 */
const generateTsObject = (chain) => {
    return `

export const ${chain.objectName}: ChainInfo = {
    name: '${chain.name}',
    urls: {
        rpc: '${chain.rpc}',
        rest: '${chain.rest}',
        socket: '${chain.socket}',
    },
    prefixes: {
        prefix: '${chain.prefix}',
        valoperPrefix: '${chain.valoperPrefix}',
        consPrefix: '${chain.consPrefix}',
    },
    decimals: ${chain.decimals},
}    
`
}