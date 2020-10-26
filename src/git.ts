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

    return emitter
      .clone(outputPath)
      .then(resolve)
      .catch(error => {
        reject();
        throw new Error(
          `Failed to fetch repo ${repoUrl}: ${error.message || error}`
        );
      });
  });
};
