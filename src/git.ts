import degit from 'degit';

/**
 * Fetch a Git repository and return the file system path of the folder containing the repository.
 *
 * @return {Promise<void>}
 */
export const fetchRepository = async (
  repoUrl: string,
  outputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const emitter = degit(repoUrl, {
      // caching can cause problems and should stay disabled.
      cache: false,
      // forcibly overwrite any existing files in the directory
      force: true,
    });

    // emitter.on('info', info => {
    //   console.log(' ');
    //   console.log('😆️', info.message);
    //   console.log('info', info);
    //   console.log(' ');
    // });

    return emitter
      .clone(outputPath)
      .then(() => {
        console.log('done');
        return resolve();
      })
      .catch(error => {
        reject();
        throw new Error(
          `Failed to fetch repo ${repoUrl}: ${error.message || error}`
        );
      });
  });
};
