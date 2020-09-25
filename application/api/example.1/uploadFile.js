async ({ name, data }) => {
  const buffer = Buffer.from(data, 'base64');
  const tmpPath = 'application/tmp';
  const filePath = node.path.join(tmpPath, name);
  if (filePath.startsWith(tmpPath)) {
    await node.fsp.writeFile(filePath, buffer);
  }
  return { uploaded: data.length };
};
