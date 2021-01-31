FROM python
RUN apt-get update && \
  apt-get install -y librsvg2-bin && \
  pip install pdftools && \
  rm -rf /var/lib/apt/lists/
COPY merge.sh /
RUN chmod -R 777 /merge.sh
WORKDIR "/code"
ENTRYPOINT ["/merge.sh"]
